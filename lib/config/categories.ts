export type CategoryCard = {
  name: string;
  code: string;
  description: string;
  image: string;
  href: string;
};

export const CATEGORY_CARDS: CategoryCard[] = [
  {
    name: 'Phones',
    code: 'PH',
    description: 'Latest smartphones from top brands',
    image:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773055199/Heat_forged_aluminum_unibody_design_for_exceptional_pro_capability._nwpsxm.png',
    href: '/products?type=PH',
  },
  {
    name: 'Laptops',
    code: 'LT',
    description: 'Powerful laptops for work and play',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773055801/mac_rehplw.png',
    href: '/products?type=LT',
  },
  {
    name: 'Tablets/Ipads',
    code: 'TB',
    description: 'Portable tablets for productivity',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773056536/ipadpro_klepgq.png',
    href: '/products?type=TB',
  },
  {
    name: 'Accessories',
    code: 'AC',
    description: 'Essential accessories and peripherals',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773056301/rhode_lk7kcy.png',
    href: '/products?type=AC',
  },
];
