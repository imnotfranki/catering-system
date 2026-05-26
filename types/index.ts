export type Rola = 'admin' | 'placowka' | 'kuchnia' | 'kierowca'
export type TypPosilku = 'sniadanie' | 'obiad' | 'podwieczorek'
export type StatusZamowienia =
  | 'oczekujace'
  | 'przyjete'
  | 'w_realizacji'
  | 'dostarczone'

export interface Placowka {
  id: string
  nazwa: string
  adres: string
  typ: 'zlobek' | 'przedszkole' | 'szkola' | 'osp' | 'dorosli'
  aktywna: boolean
}

export interface Zamowienie {
  id: string
  placowka_id: string
  data: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: { nazwa: string; ilosc: number }[]
  status: StatusZamowienia
  utworzone_o: string
}

export interface JadlospisWpis {
  id: string
  data: string
  posilek: TypPosilku
  opis: string
  skladniki: { nazwa: string; gramatura_na_porcje: number }[]
}
