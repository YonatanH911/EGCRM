'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Direction = 'ltr' | 'rtl';
type FontSize = 'normal' | 'large';

interface PreferencesContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    direction: Direction;
    setDirection: (direction: Direction) => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    isLoaded: boolean;
    isRTL: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [direction, setDirectionState] = useState<Direction>('ltr');
    const [fontSize, setFontSizeState] = useState<FontSize>('normal');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load preferences from local storage
        const savedTheme = localStorage.getItem('crm_theme') as Theme | null;
        const savedDir = localStorage.getItem('crm_direction') as Direction | null;
        const savedSize = localStorage.getItem('crm_fontSize') as FontSize | null;

        if (savedTheme) setThemeState(savedTheme);
        if (savedDir) setDirectionState(savedDir);
        else {
            // check system language if hebrew
            if (navigator.language.startsWith('he')) {
                setDirectionState('rtl');
            }
        }
        if (savedSize) setFontSizeState(savedSize);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('crm_theme', theme);
        localStorage.setItem('crm_direction', direction);
        localStorage.setItem('crm_fontSize', fontSize);

        const html = document.documentElement;

        // Theme
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        // Direction
        html.dir = direction;

        // Font Size
        if (fontSize === 'large') {
            html.classList.add('text-large');
        } else {
            html.classList.remove('text-large');
        }

    }, [theme, direction, fontSize, isLoaded]);

    return (
        <PreferencesContext.Provider value={{
            theme, setTheme: setThemeState,
            direction, setDirection: setDirectionState,
            fontSize, setFontSize: setFontSizeState,
            isLoaded,
            isRTL: direction === 'rtl'
        }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
}
