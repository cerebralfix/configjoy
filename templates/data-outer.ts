import { createContext } from 'react';
import { Change } from '../../pages/_app';

export const dataObjects = [
    __NAMES__
]

export const dataContext = createContext<{ data: { data: any }, functions: { handleChange: (change: Change) => void } }>(null as any);