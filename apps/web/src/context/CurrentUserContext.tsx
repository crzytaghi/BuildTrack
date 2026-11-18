import { createContext, useContext } from 'react';
import type { User } from '../types/projects';

const CurrentUserContext = createContext<User | null>(null);

export const CurrentUserProvider = CurrentUserContext.Provider;

/** The signed-in user. Only available inside the signed-in app shell. */
export const useCurrentUser = () => useContext(CurrentUserContext);

/** The signed-in user's role, or undefined outside the app shell. */
export const useRole = () => useContext(CurrentUserContext)?.role;
