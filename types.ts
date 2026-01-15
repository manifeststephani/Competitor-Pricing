
export type PriceBucket = 
  | 'Under $100' 
  | '$100 to $199' 
  | '$200 to $299' 
  | '$300 to $399' 
  | '$400 to $599' 
  | '$600 to $799' 
  | '$799 to $999' 
  | '$1000+';

export type Category = 
  | 'Tees, Henleys & Tanks'
  | 'Casual Shirts'
  | 'Dress Shirts'
  | 'Polos'
  | 'Sweater Polos'
  | 'Sweaters'
  | 'Cardigans & Zip-Ups'
  | 'Sweatshirts'
  | 'Shirt Jackets & Overshirts'
  | 'Coats & Outerwear'
  | 'Suit Jackets & Sport Coats'
  | 'Jeans & Denim'
  | 'Casual Pants (chinos and khakis)'
  | 'Dress Pants'
  | 'Sweatpants'
  | 'Shorts';

export interface StyleCountData {
  category: Category;
  counts: Record<PriceBucket, number>;
}

export interface CompetitorData {
  id: string;
  name: string;
  url: string;
  logo: string;
  lastUpdated: string;
  totalStyles: number;
  data: StyleCountData[];
  sources?: GroundingSource[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}