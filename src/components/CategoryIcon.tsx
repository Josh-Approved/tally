import React from 'react';
import {
  ShoppingBasket, Utensils, Bus, Fuel, Receipt, Home, Repeat, HeartPulse,
  ShoppingBag, Film, Plane, Circle, Briefcase, Laptop, Gift,
  Coffee, Car, Train, GraduationCap, Dumbbell, Stethoscope, PawPrint,
  Baby, Wrench, Phone, Wifi, BookOpen, Music, Pizza, Beer, Wine,
  Hammer, Scissors, Palette, Camera, Bike, Sparkles, Wallet, Tag,
  type LucideProps,
} from 'lucide-react-native';

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  'shopping-basket': ShoppingBasket,
  'utensils': Utensils,
  'bus': Bus,
  'fuel': Fuel,
  'receipt': Receipt,
  'home': Home,
  'repeat': Repeat,
  'heart-pulse': HeartPulse,
  'shopping-bag': ShoppingBag,
  'film': Film,
  'plane': Plane,
  'circle': Circle,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'gift': Gift,
  'coffee': Coffee,
  'car': Car,
  'train': Train,
  'graduation-cap': GraduationCap,
  'dumbbell': Dumbbell,
  'stethoscope': Stethoscope,
  'paw-print': PawPrint,
  'baby': Baby,
  'wrench': Wrench,
  'phone': Phone,
  'wifi': Wifi,
  'book-open': BookOpen,
  'music': Music,
  'pizza': Pizza,
  'beer': Beer,
  'wine': Wine,
  'hammer': Hammer,
  'scissors': Scissors,
  'palette': Palette,
  'camera': Camera,
  'bike': Bike,
  'sparkles': Sparkles,
  'wallet': Wallet,
  'tag': Tag,
};

export const ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, size = 22, color }: { name: string; size?: number; color: string }) {
  const Cmp = ICONS[name] ?? Tag;
  return <Cmp size={size} color={color} strokeWidth={1.5} />;
}
