import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
	content: {
		filesystem: [
			'src/**/*.{html,js,svelte,ts}'
		]
	},
	presets: [
		presetUno()
	],
	// Tailwind-like CSS reset/preflight
	preflights: [
		{
			getCSS: () => `
				*,::before,::after {
					box-sizing: border-box;
					border-width: 0;
					border-style: solid;
					border-color: currentColor;
				}
				html {
					line-height: 1.5;
					-webkit-text-size-adjust: 100%;
					-moz-tab-size: 4;
					tab-size: 4;
					font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
					font-feature-settings: normal;
				}
				body {
					margin: 0;
					line-height: inherit;
					background-color: rgb(17, 24, 39);
					color: rgb(255, 255, 255);
					min-height: 100vh;
				}
				h1,h2,h3,h4,h5,h6 {
					font-size: inherit;
					font-weight: inherit;
				}
				a {
					color: inherit;
					text-decoration: inherit;
				}
				b,strong {
					font-weight: bolder;
				}
				button,input,optgroup,select,textarea {
					font-family: inherit;
					font-size: 100%;
					font-weight: inherit;
					line-height: inherit;
					color: inherit;
					margin: 0;
					padding: 0;
				}
				button,select {
					text-transform: none;
				}
				button,[type='button'],[type='reset'],[type='submit'] {
					-webkit-appearance: button;
					background-color: transparent;
					background-image: none;
				}
				img,svg,video,canvas,audio,iframe,embed,object {
					display: block;
					vertical-align: middle;
				}
				img,video {
					max-width: 100%;
					height: auto;
				}
			`
		}
	],
	shortcuts: {
		'btn': 'px-4 py-2 rounded transition-colors',
		'btn-primary': 'btn bg-blue-600 hover:bg-blue-700 text-white'
	}
});
