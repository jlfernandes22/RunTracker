import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import * as Location from 'expo-location';
import { StyleSheet, View, DimensionValue } from 'react-native';import { overlayTokens } from '../theme/tokens';

import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { GeoPoint } from '../types';
import { session } from '../services/RunSession';
import { MAP_HTML } from '../map/mapHtml';

export type MapMode = 'plan' | 'track';
export type MapTheme = 'light' | 'dark';

interface Props {
  waypoints: GeoPoint[];
  plannedRoute?: GeoPoint[];
  onPressPoint?: (lat: number, lng: number) => void;
  onLocate?: (lat: number, lng: number) => void;
  mode?: MapMode;
  theme?: MapTheme;
  height?: DimensionValue;
  fitOnMount?: boolean;
}

export interface MapWebViewHandle {
  centerOn: (lat: number, lng: number) => void;
  showLocation: (lat: number, lng: number, accuracy?: number | null) => void;
  locate: () => Promise<{ ok: boolean; message?: string }>;
}

export const MapWebView = forwardRef<MapWebViewHandle, Props>(function MapWebView(
  {
    waypoints,
    plannedRoute = [],
    onPressPoint,
    onLocate,
    mode = 'plan',
    theme = 'dark',
    height,
    fitOnMount,
  }: Props,
  ref,
) {
  const webRef = useRef<any>(null);
  const readyRef = useRef(false);
  const firstApply = useRef(true);

  const lastMode = useRef(mode);
  const lastTheme = useRef(theme);
  const modeRef = useRef(mode);
  const pendingLocate = useRef<{ lat: number; lng: number; accuracy: number | null } | null>(null);

  const postUpdate = useCallback(
    (fit: boolean) => {
      webRef.current?.postMessage(
        JSON.stringify({
          type: 'update',
          waypoints,
          planned: plannedRoute,
          fit: fit && firstApply.current,
          mode: lastMode.current,
          theme: lastTheme.current,
        }),
      );
      firstApply.current = false;
    },
    [waypoints, plannedRoute],
  );

  useEffect(() => {
    lastMode.current = mode;
    lastTheme.current = theme;
    modeRef.current = mode;
    if (readyRef.current) postUpdate(false);
  }, [mode, theme, postUpdate]);

  const locateOnMap = useCallback((): Promise<{ ok: boolean; message?: string }> => {
    return new Promise((resolve) => {
      (async () => {
        try {
          const perm = await Location.requestForegroundPermissionsAsync();
          if (!perm.granted) {
            resolve({ ok: false, message: 'Location permission denied' });
            return;
          }
        } catch {
          resolve({ ok: false, message: 'Could not request location permission' });
          return;
        }
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            timeInterval: 15000,
          });
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          console.log('[map] located at', lat.toFixed(5), lng.toFixed(5));
          if (modeRef.current === 'track') {
            session.addLocatedPoint(lat, lng, pos.coords.accuracy);
            if (readyRef.current) {
              webRef.current?.postMessage(JSON.stringify({ type: 'center', lat, lng }));
            } else {
              pendingLocate.current = { lat, lng, accuracy: null };
            }
          } else if (readyRef.current) {
            webRef.current?.postMessage(
              JSON.stringify({ type: 'user-location', lat, lng, accuracy: pos.coords.accuracy, center: true }),
            );
          } else {
            pendingLocate.current = { lat, lng, accuracy: pos.coords.accuracy };
          }
          onLocate?.(lat, lng);
          resolve({ ok: true });
        } catch (err) {
          console.warn('[map] locate failed', String(err));
          resolve({ ok: false, message: 'Could not get your location. Check GPS.' });
        }
      })();
    });
  }, [onLocate]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(e.nativeEvent.data);
        if (data.type === 'tap') {
          onPressPoint?.(data.lat, data.lng);
        } else if (data.type === 'locate') {
          onLocate?.(data.lat, data.lng);
        } else if (data.type === 'status') {
          console.log('[map]', data.text);
        } else if (data.type === 'ready') {
          readyRef.current = true;
          if (pendingLocate.current) {
            const p = pendingLocate.current;
            pendingLocate.current = null;
            webRef.current?.postMessage(
              JSON.stringify({ type: 'user-location', lat: p.lat, lng: p.lng, accuracy: p.accuracy, center: true }),
            );
          }
          postUpdate(fitOnMount ?? true);
        }
      } catch {}
    },
    [onPressPoint, onLocate, postUpdate, fitOnMount],
  );

  useImperativeHandle(ref, () => ({
    centerOn: (lat: number, lng: number) => {
      if (readyRef.current) {
        webRef.current?.postMessage(JSON.stringify({ type: 'center', lat, lng }));
      } else {
        pendingLocate.current = { lat, lng, accuracy: null };
      }
    },
    showLocation: (lat: number, lng: number, accuracy?: number | null) => {
      webRef.current?.postMessage(
        JSON.stringify({ type: 'user-location', lat, lng, accuracy: accuracy ?? null, center: false }),
      );
    },
    locate: () => locateOnMap(),
  }));

  return (
    <View style={[styles.container, { height }]} accessible={false}>
      <WebView
        ref={webRef}
        source={{ html: MAP_HTML, baseUrl: 'https://map.local' }}
        onMessage={onMessage}
        style={{ flex: 1, backgroundColor: overlayTokens.mapCanvasLight }}
        originWhitelist={['*']}
        mixedContentMode="always"
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        setSupportMultipleWindows={false}
        forceDarkOn={false}
        allowsInlineMediaPlayback
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});

