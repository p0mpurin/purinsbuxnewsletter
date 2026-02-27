export interface Contact {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface Product {
  code?: string;
  name?: string;
  price_store?: string;
  price_airport?: string;
  pack_size?: string;
  old_code?: string;
  new_code?: string;
}

export interface StockUpdate {
  code?: string;
  name?: string;
  status?: string;
}

export interface NewsletterItem {
  title?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  content?: string;
  attachments?: string[];
  products?: Product[];
  contacts?: Contact[];
  stock_updates?: StockUpdate[] | null;
  images?: string[];
  bullet_points?: string[];
}

export interface Section {
  title: string;
  items: NewsletterItem[];
}

export interface NewsletterData {
  week?: string;
  sections: Section[];
}
