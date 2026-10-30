export {}

declare global {
  interface LeafletMap {
    setView: (latlng: [number, number], zoom: number) => LeafletMap
    remove: () => void
    fitBounds: (bounds: any, options?: any) => LeafletMap
  }

  interface Window {
    L: any
  }
}
