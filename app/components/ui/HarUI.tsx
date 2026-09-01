'use client';

import { Alert, Badge, Button, Input } from '@harjs/react-ui';

export const HarButton = Button;
export const HarInput = Input;
export const HarBadge = Badge;
export const HarAlert = Alert;

export const HarThemeSwitch = ({
	theme,
	toggleTheme,
}: {
	theme: 'light' | 'dark';
	toggleTheme: () => void;
}) => (
	<HarButton
		type="button"
		variant="borderless"
		color="gray"
		aria-label="Tema değiştir"
		aria-pressed={theme === 'dark'}
		onClick={(event) => {
			event.stopPropagation();
			toggleTheme();
		}}
		className={`theme-switch-button ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
	>
		<span className="theme-switch-thumb" />
	</HarButton>
);
