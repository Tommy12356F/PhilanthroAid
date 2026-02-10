export type DonationCategory =
  | "food"
  | "clothes"
  | "books"
  | "other"

export type DonationStatus =
  | "open"
  | "matched"
  | "completed"
  | "cancelled"

export interface Donation {
  id: string
  donorId: string
  category: DonationCategory
  description: string
  quantity: string
  city: string
  pickupLocation: {
    lat: number
    lng: number
  }
  status: DonationStatus
}
