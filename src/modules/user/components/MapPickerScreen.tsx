import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft, MapPin, Navigation, Phone, User, X,
  Maximize2, Minimize2, Search,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/hooks/useTheme';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
  area: string;
  city: string;
}

interface MapPickerScreenProps {
  onConfirm: (location: PickedLocation, fullName: string, phone: string) => void;
  onClose: () => void;
  saving?: boolean;
}

// ── Leaflet HTML (postMessage works for both iframe and native WebView) ───────
const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;overflow:hidden}
#pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);z-index:999;pointer-events:none}
#pin svg{filter:drop-shadow(0 3px 7px rgba(0,0,0,.5))}
#bar{position:absolute;bottom:0;left:0;right:0;background:rgba(15,23,42,.88);
  padding:8px 12px;z-index:1000;font-family:-apple-system,sans-serif;display:flex;align-items:flex-start;gap:6px}
#addrTxt{color:#fff;font-size:11px;font-weight:600;line-height:1.4;flex:1;word-break:break-word}
.leaflet-control-attribution{display:none!important}
.leaflet-control-zoom{margin:10px!important}
</style>
</head>
<body>
<div id="map"></div>
<div id="pin">
  <svg width="38" height="50" viewBox="0 0 38 50" fill="none">
    <path d="M19 0C8.5 0 0 8.5 0 19C0 33.25 19 50 19 50S38 33.25 38 19C38 8.5 29.5 0 19 0Z" fill="#22C55E"/>
    <circle cx="19" cy="19" r="8" fill="white"/>
    <circle cx="19" cy="19" r="4.5" fill="#22C55E"/>
  </svg>
</div>
<div id="bar">
  <span>📍</span>
  <div id="addrTxt">Move the map to pin your delivery location…</div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
function send(data){
  var msg=JSON.stringify(data);
  try{ if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(msg);}else{window.parent.postMessage(msg,'*');} }catch(e){}
}

var map, geocodeTimer, lat=23.8103, lng=90.4125;

function initMap(){
  map=L.map('map',{center:[lat,lng],zoom:15,zoomControl:true,attributionControl:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

  map.on('move',function(){
    var c=map.getCenter(); lat=c.lat; lng=c.lng;
  });
  map.on('moveend',function(){
    clearTimeout(geocodeTimer);
    geocodeTimer=setTimeout(function(){reverseGeocode(lat,lng);},700);
  });

  window.addEventListener('message',function(e){
    try{
      var d=JSON.parse(e.data||'{}');
      if(d.type==='panTo'&&map){ map.setView([d.lat,d.lng],d.zoom||15); }
    }catch(ex){}
  });

  send({type:'ready'});
  setTimeout(function(){reverseGeocode(lat,lng);},900);
}

function reverseGeocode(la,lo){
  fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+la+'&lon='+lo+'&zoom=16&addressdetails=1',
        {headers:{'Accept-Language':'en','User-Agent':'DeliveryApp/1.0'}})
    .then(function(r){return r.json();})
    .then(function(d){
      var addr=d.display_name||('Lat '+la.toFixed(4)+', Lng '+lo.toFixed(4));
      var area='',city='';
      if(d.address){var a=d.address;area=a.suburb||a.neighbourhood||a.village||a.town||'';city=a.city||a.town||a.state||'';}
      var short=(addr.split(',').slice(0,3).join(',')).trim();
      document.getElementById('addrTxt').innerText=short||addr;
      send({type:'location',lat:la,lng:lo,address:short||addr,area:area,city:city});
    })
    .catch(function(){
      var fb='Location at '+la.toFixed(4)+', '+lo.toFixed(4);
      document.getElementById('addrTxt').innerText=fb;
      send({type:'location',lat:la,lng:lo,address:fb,area:'',city:'Dhaka'});
    });
}

if(typeof L!=='undefined'){initMap();}
else{window.addEventListener('load',function(){if(typeof L!=='undefined')initMap();});}
</script>
</body>
</html>`;

const AREA_PRESETS = [
  { label: 'Dhanmondi', lat: 23.7461, lng: 90.3742, area: 'Dhanmondi', city: 'Dhaka' },
  { label: 'Gulshan',   lat: 23.7806, lng: 90.4152, area: 'Gulshan',   city: 'Dhaka' },
  { label: 'Mirpur',    lat: 23.8223, lng: 90.3654, area: 'Mirpur',    city: 'Dhaka' },
  { label: 'Uttara',    lat: 23.8759, lng: 90.3795, area: 'Uttara',    city: 'Dhaka' },
  { label: 'Old Dhaka', lat: 23.7104, lng: 90.4074, area: 'Old Dhaka', city: 'Dhaka' },
];

export function MapPickerScreen({ onConfirm, onClose, saving = false }: MapPickerScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [pickedLocation, setPickedLocation]   = useState<PickedLocation | null>(null);
  const [pickedAddress, setPickedAddress]     = useState('');
  const [fullName, setFullName]               = useState('');
  const [phone, setPhone]                     = useState('');
  const [mapError, setMapError]               = useState('');
  const [mapReady, setMapReady]               = useState(false);
  const [isFullscreen, setIsFullscreen]       = useState(false);
  const [searchText, setSearchText]           = useState('');
  const [searching, setSearching]             = useState(false);
  const [selectedPreset, setSelectedPreset]   = useState<number | null>(null);

  const nameRef    = useRef<TextInput>(null);
  const phoneRef   = useRef<TextInput>(null);
  const searchRef  = useRef<TextInput>(null);
  const iframeRef  = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  const sendToMap = useCallback((data: object) => {
    const msg = JSON.stringify(data);
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(msg, '*');
    } else {
      webViewRef.current?.injectJavaScript(`
        window.dispatchEvent(new MessageEvent('message', { data: '${msg.replace(/'/g, "\\'")}' })); true;
      `);
    }
  }, []);

  const handleMessage = useCallback((rawData: string) => {
    try {
      const data = JSON.parse(rawData);
      if (data.type === 'ready') setMapReady(true);
      else if (data.type === 'location') {
        setPickedLocation({ lat: data.lat, lng: data.lng, address: data.address, area: data.area || '', city: data.city || 'Dhaka' });
        setPickedAddress(data.address);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'string') handleMessage(e.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleMessage]);

  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText.trim())}&limit=1&countrycodes=bd`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'DeliveryApp/1.0' } });
      const results = await res.json();
      if (results && results.length > 0) {
        const r = results[0];
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        sendToMap({ type: 'panTo', lat, lng, zoom: 16 });
        setPickedLocation({ lat, lng, address: r.display_name, area: '', city: 'Dhaka' });
        setPickedAddress((r.display_name.split(',').slice(0, 3).join(',').trim()));
      } else {
        setMapError('Location not found. Try a different search.');
      }
    } catch {
      setMapError('Search failed. Check your connection.');
    } finally {
      setSearching(false);
    }
  };

  const handlePresetSelect = (i: number) => {
    const p = AREA_PRESETS[i];
    setSelectedPreset(i);
    sendToMap({ type: 'panTo', lat: p.lat, lng: p.lng, zoom: 15 });
    setPickedLocation({ lat: p.lat, lng: p.lng, address: `${p.area}, ${p.city}`, area: p.area, city: p.city });
    setPickedAddress(`${p.area}, ${p.city}`);
  };

  const handleConfirm = () => {
    if (!fullName.trim()) { setMapError('Please enter your name'); nameRef.current?.focus(); return; }
    if (!phone.trim())    { setMapError('Please enter your phone number'); phoneRef.current?.focus(); return; }
    if (!pickedLocation)  { setMapError('Move the map or search to select a location'); return; }
    setMapError('');
    onConfirm(pickedLocation, fullName.trim(), phone.trim());
  };

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          ref={iframeRef}
          srcDoc={LEAFLET_HTML}
          style={{ width: '100%', height: '100%', border: 'none' } as React.CSSProperties}
          onLoad={() => setTimeout(() => setMapReady(true), 500)}
          title="Delivery Map"
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { WebView } = require('react-native-webview');
    return (
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML }}
        style={{ flex: 1 }}
        onMessage={(e: any) => handleMessage(e.nativeEvent.data)}
        onLoad={() => setTimeout(() => setMapReady(true), 500)}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />
    );
  };

  const MAP_HEIGHT = isFullscreen ? SCREEN_HEIGHT : 220;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      {!isFullscreen && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: Math.max((insets?.top || 0), spacing.sm) }]}>
          <TouchableOpacity onPress={onClose} style={[styles.iconBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MapPin size={15} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Select Address using Map</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Map ── */}
      <View style={[styles.mapWrapper, { height: MAP_HEIGHT }]}>
        {!mapReady && (
          <View style={[styles.loaderOverlay, { backgroundColor: colors.inputBg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading map…</Text>
          </View>
        )}

        {renderMap()}

        <TouchableOpacity
          onPress={() => setIsFullscreen(!isFullscreen)}
          style={[styles.fsBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
        >
          {isFullscreen
            ? <Minimize2 size={18} color="#0F172A" />
            : <Maximize2 size={18} color="#0F172A" />}
        </TouchableOpacity>

        {isFullscreen && (
          <TouchableOpacity
            onPress={onClose}
            style={[styles.fsCloseBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
          >
            <X size={18} color="#0F172A" />
          </TouchableOpacity>
        )}

        {isFullscreen && pickedAddress !== '' && (
          <View style={[styles.fsBottomStrip, { backgroundColor: colors.surface }]}>
            <View style={styles.fsAddressRow}>
              <MapPin size={14} color={colors.primary} />
              <Text style={[styles.fsAddressText, { color: colors.text }]} numberOfLines={2}>
                {pickedAddress}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsFullscreen(false)}
              style={[styles.fsConfirmBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.fsConfirmBtnText}>Use This Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Content Below Map ── */}
      {!isFullscreen && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max((insets?.bottom || 0) + 20, 28) }]}>
            
            {/* 1. Search Location & Area Chips Section */}
            <View style={styles.searchSection}>
              <View style={styles.searchRow}>
                <View style={[styles.searchInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Search size={15} color={colors.textSecondary} />
                  <TextInput
                    ref={searchRef}
                    style={[styles.searchInput, { color: colors.text }]}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search location on map…"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                      <X size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={searching}
                  style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Search size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Area Quick Chips - Flex Wrap (Responsive, zero right cut-off) */}
              <View style={styles.chipsWrapContainer}>
                {AREA_PRESETS.map((p, i) => (
                  <TouchableOpacity
                    key={p.label}
                    onPress={() => handlePresetSelect(i)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedPreset === i ? colors.primary : colors.inputBg,
                        borderColor: selectedPreset === i ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <MapPin size={11} color={selectedPreset === i ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.chipText, { color: selectedPreset === i ? '#fff' : colors.text }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Selected Pin Address Box (Responsive, zero right cut-off) */}
            {pickedAddress ? (
              <View style={[styles.addressCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <View style={styles.addressCardIcon}>
                  <MapPin size={15} color={colors.primary} />
                </View>
                <Text style={[styles.addressCardText, { color: colors.primary }]}>
                  {pickedAddress}
                </Text>
              </View>
            ) : (
              <View style={[styles.addressCardEmpty, { borderColor: colors.border }]}>
                <MapPin size={14} color={colors.textTertiary} />
                <Text style={[styles.addressCardEmptyText, { color: colors.textTertiary }]}>
                  No location selected — move map or search above
                </Text>
              </View>
            )}

            {/* 3. Contact Details Form Section (Placed UNDER) */}
            <View style={styles.contactSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Details</Text>

              <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <User size={16} color={colors.textSecondary} />
                <TextInput
                  ref={nameRef}
                  style={[styles.textInput, { color: colors.text }]}
                  value={fullName}
                  onChangeText={(t) => { setFullName(t); setMapError(''); }}
                  placeholder="Full name *"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  blurOnSubmit={false}
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Phone size={16} color={colors.textSecondary} />
                <TextInput
                  ref={phoneRef}
                  style={[styles.textInput, { color: colors.text }]}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setMapError(''); }}
                  placeholder="01XXXXXXXXX *"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              </View>

              {mapError ? <Text style={[styles.errorText, { color: colors.error }]}>{mapError}</Text> : null}

              {/* Deliver Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirm}
                disabled={saving}
                style={[styles.deliverBtn, { backgroundColor: saving ? colors.border : colors.primary }]}
              >
                <Navigation size={18} color="#FFFFFF" />
                <Text style={styles.deliverBtnText}>{saving ? 'Saving…' : 'Deliver to This Location'}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  headerTitle: { ...typography.h4, fontSize: 14 },

  mapWrapper: { position: 'relative', overflow: 'hidden' },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 20,
  },
  loaderText: { ...typography.bodySmall },

  fsBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fsCloseBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fsBottomStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    padding: spacing.md,
    gap: 10,
  },
  fsAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  fsAddressText: {
    ...typography.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  fsConfirmBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  fsConfirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
    width: '100%',
  },

  // Address card - 100% responsive, no right-side cut off
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  addressCardIcon: { flexShrink: 0 },
  addressCardText: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
    flexWrap: 'wrap',
    minWidth: 0,
    lineHeight: 18,
  },
  addressCardEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  addressCardEmptyText: {
    ...typography.caption,
    flex: 1,
    minWidth: 0,
  },

  // Search & Presets section
  searchSection: {
    gap: 8,
    width: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 5,
    minWidth: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    minWidth: 0,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipsWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 11, fontWeight: '600' },

  // Contact section UNDER
  contactSection: {
    gap: 8,
    marginTop: 2,
    width: '100%',
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    minWidth: 0,
  },
  errorText: { ...typography.caption },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 2,
    width: '100%',
  },
  deliverBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});
