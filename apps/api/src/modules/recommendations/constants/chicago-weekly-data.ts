export interface WeeklyRestaurant {
  name: string;
  address: string | null;
  cuisine: string[];
  price_level: 'cheap' | 'moderate' | 'expensive' | 'luxury' | null;
  rating: number | null;
}

export interface WeeklyEvent {
  name: string;
  venue: string | null;
  address: string | null;
  start_time_local: string;
  end_time_local: string | null;
  category: 'music' | 'comedy' | 'art' | 'food' | 'sports' | 'outdoors' | 'nightlife' | 'other';
  price: 'free' | 'paid' | 'unknown';
}

export interface WeeklyChicagoData {
  city: string;
  week_start: string;
  week_end: string;
  restaurants: WeeklyRestaurant[];
  events: WeeklyEvent[];
}

export const CHICAGO_WEEKLY_DATA: WeeklyChicagoData = {
  city: 'Chicago',
  week_start: '2026-03-01',
  week_end: '2026-03-07',
  restaurants: [
    {
      name: 'Alinea',
      address: '1723 N Halsted St, Chicago, IL 60614',
      cuisine: ['Modern American'],
      price_level: 'luxury',
      rating: 4.7
    },
    {
      name: 'Girl & the Goat',
      address: '809 W Randolph St, Chicago, IL 60607',
      cuisine: ['American', 'Mediterranean'],
      price_level: 'expensive',
      rating: 4.6
    },
    {
      name: 'Au Cheval',
      address: '800 W Randolph St, Chicago, IL 60607',
      cuisine: ['American', 'Burgers'],
      price_level: 'moderate',
      rating: 4.6
    },
    {
      name: "Bavette's Bar & Boeuf",
      address: '218 W Kinzie St, Chicago, IL 60654',
      cuisine: ['Steakhouse', 'French'],
      price_level: 'expensive',
      rating: 4.8
    },
    {
      name: 'Monteverde',
      address: '1020 W Madison St, Chicago, IL 60607',
      cuisine: ['Italian'],
      price_level: 'expensive',
      rating: 4.7
    },
    {
      name: 'The Purple Pig',
      address: '500 N Michigan Ave, Chicago, IL 60611',
      cuisine: ['Mediterranean'],
      price_level: 'moderate',
      rating: 4.5
    },
    {
      name: 'Smyth',
      address: '177 N Ada St #101, Chicago, IL 60607',
      cuisine: ['Contemporary American'],
      price_level: 'luxury',
      rating: 4.8
    },
    {
      name: 'Kasama',
      address: '1001 N Winchester Ave, Chicago, IL 60622',
      cuisine: ['Filipino'],
      price_level: 'moderate',
      rating: 4.7
    },
    {
      name: "Pequod's Pizza",
      address: '2207 N Clybourn Ave, Chicago, IL 60614',
      cuisine: ['Pizza'],
      price_level: 'cheap',
      rating: 4.6
    },
    {
      name: 'Parachute',
      address: '3500 N Elston Ave, Chicago, IL 60618',
      cuisine: ['Korean', 'American'],
      price_level: 'expensive',
      rating: 4.6
    },
    {
      name: 'Virtue Restaurant',
      address: '1462 E 53rd St, Chicago, IL 60615',
      cuisine: ['Southern'],
      price_level: 'moderate',
      rating: 4.7
    },
    {
      name: 'Mott St',
      address: '1401 N Ashland Ave, Chicago, IL 60622',
      cuisine: ['Asian Fusion'],
      price_level: 'moderate',
      rating: 4.5
    },
    {
      name: 'RPM Italian',
      address: '52 W Illinois St, Chicago, IL 60654',
      cuisine: ['Italian'],
      price_level: 'expensive',
      rating: 4.5
    },
    {
      name: 'Giant',
      address: '3209 W Armitage Ave, Chicago, IL 60647',
      cuisine: ['American'],
      price_level: 'moderate',
      rating: 4.6
    },
    {
      name: "Cindy's Rooftop",
      address: '12 S Michigan Ave, Chicago, IL 60603',
      cuisine: ['American'],
      price_level: 'expensive',
      rating: 4.4
    },
    {
      name: "Portillo's",
      address: '100 W Ontario St, Chicago, IL 60654',
      cuisine: ['American', 'Fast Food'],
      price_level: 'cheap',
      rating: 4.4
    },
    {
      name: 'Duck Duck Goat',
      address: '857 W Fulton Market, Chicago, IL 60607',
      cuisine: ['Chinese'],
      price_level: 'expensive',
      rating: 4.5
    },
    {
      name: 'Beatrix',
      address: '519 N Clark St, Chicago, IL 60654',
      cuisine: ['American'],
      price_level: 'moderate',
      rating: 4.4
    },
    {
      name: 'Armitage Alehouse',
      address: '1000 W Armitage Ave, Chicago, IL 60614',
      cuisine: ['British'],
      price_level: 'expensive',
      rating: 4.7
    },
    {
      name: 'Tzuco',
      address: '720 N State St, Chicago, IL 60654',
      cuisine: ['Mexican'],
      price_level: 'expensive',
      rating: 4.6
    }
  ],
  events: [
    {
      name: 'Chicago Bulls Home Game',
      venue: 'United Center',
      address: '1901 W Madison St, Chicago, IL 60612',
      start_time_local: '2026-03-03T19:00:00-06:00',
      end_time_local: null,
      category: 'sports',
      price: 'paid'
    },
    {
      name: 'Chicago Blackhawks Home Game',
      venue: 'United Center',
      address: '1901 W Madison St, Chicago, IL 60612',
      start_time_local: '2026-03-05T19:30:00-06:00',
      end_time_local: null,
      category: 'sports',
      price: 'paid'
    },
    {
      name: 'First Fridays at the Art Institute',
      venue: 'Art Institute of Chicago',
      address: '111 S Michigan Ave, Chicago, IL 60603',
      start_time_local: '2026-03-06T18:00:00-06:00',
      end_time_local: '2026-03-06T21:00:00-06:00',
      category: 'art',
      price: 'paid'
    },
    {
      name: 'Lincoln Park Conservatory Spring Preview',
      venue: 'Lincoln Park Conservatory',
      address: '2391 N Stockton Dr, Chicago, IL 60614',
      start_time_local: '2026-03-01T10:00:00-06:00',
      end_time_local: '2026-03-01T17:00:00-06:00',
      category: 'outdoors',
      price: 'free'
    },
    {
      name: 'Stand-Up Showcase Night',
      venue: 'The Laugh Factory',
      address: '3175 N Broadway, Chicago, IL 60657',
      start_time_local: '2026-03-04T20:00:00-06:00',
      end_time_local: null,
      category: 'comedy',
      price: 'paid'
    },
    {
      name: 'Live Jazz Night',
      venue: 'Green Mill Cocktail Lounge',
      address: '4802 N Broadway, Chicago, IL 60640',
      start_time_local: '2026-03-06T21:00:00-06:00',
      end_time_local: null,
      category: 'music',
      price: 'paid'
    },
    {
      name: 'Riverwalk Winter Stroll',
      venue: 'Chicago Riverwalk',
      address: 'Chicago Riverwalk, Chicago, IL',
      start_time_local: '2026-03-07T12:00:00-06:00',
      end_time_local: '2026-03-07T15:00:00-06:00',
      category: 'outdoors',
      price: 'free'
    },
    {
      name: 'Fulton Market Food Tour',
      venue: null,
      address: 'Fulton Market District, Chicago, IL',
      start_time_local: '2026-03-07T13:00:00-06:00',
      end_time_local: '2026-03-07T16:00:00-06:00',
      category: 'food',
      price: 'paid'
    }
  ]
};
