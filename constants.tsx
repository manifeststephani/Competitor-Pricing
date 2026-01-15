
import { PriceBucket, Category } from './types';

export const PRICE_BUCKETS: PriceBucket[] = [
  'Under $100',
  '$100 to $199',
  '$200 to $299',
  '$300 to $399',
  '$400 to $599',
  '$600 to $799',
  '$799 to $999',
  '$1000+'
];

export const CATEGORIES: Category[] = [
  'Tees, Henleys & Tanks',
  'Casual Shirts',
  'Dress Shirts',
  'Polos',
  'Sweater Polos',
  'Sweaters',
  'Cardigans & Zip-Ups',
  'Sweatshirts',
  'Shirt Jackets & Overshirts',
  'Coats & Outerwear',
  'Suit Jackets & Sport Coats',
  'Jeans & Denim',
  'Casual Pants (chinos and khakis)',
  'Dress Pants',
  'Sweatpants',
  'Shorts'
];

export const MOCK_COMPETITORS = [
  { id: '1', name: 'Buck Mason', url: 'https://www.buckmason.com/?g=men', logo: 'https://picsum.photos/seed/buckmason/200/200' },
  { id: '2', name: 'Ralph Lauren', url: 'https://www.ralphlauren.com/men', logo: 'https://picsum.photos/seed/ralphlauren/200/200' },
  { id: '3', name: 'Brooks Brothers', url: 'https://www.brooksbrothers.com/mens', logo: 'https://picsum.photos/seed/brooksbrothers/200/200' },
  { id: '4', name: 'Suit Supply', url: 'https://suitsupply.com/en-us/', logo: 'https://picsum.photos/seed/suitsupply/200/200' },
  { id: '5', name: 'Todd Snyder', url: 'https://www.toddsnyder.com/', logo: 'https://picsum.photos/seed/toddsnyder/200/200' },
  { id: '6', name: 'Sid Mashburn', url: 'https://shopmashburn.com/', logo: 'https://picsum.photos/seed/sidmashburn/200/200' },
];
