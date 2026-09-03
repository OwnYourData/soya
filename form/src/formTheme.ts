import { createTheme, Theme } from '@mui/material/styles';

/**
 * Darstellungs-Optionen für das gerenderte JSON-Forms-Formular.
 *
 * JSON Forms 3.x liest die Input-Variante über `useThemeProps({ name: 'MuiTextField' })`
 * aus dem MUI-Theme (siehe @jsonforms/material-renderers/util/theme.ts) und fällt
 * auf 'outlined' zurück. JSON Forms 2.x lief auf MUI v4, wo 'standard' (Unterstrich)
 * die Voreinstellung war — daher der deutlich höhere Platzbedarf nach dem Upgrade.
 *
 * Beide Werte können pro Struktur im OverlayForm gesetzt werden:
 *
 *   ui:
 *     type: VerticalLayout
 *     options:
 *       variant: standard     # standard | outlined | filled
 *       density: compact      # compact  | comfortable
 *     elements: [...]
 */
export type FormVariant = 'standard' | 'outlined' | 'filled';
export type FormDensity = 'compact' | 'comfortable';

export type FormAppearance = {
  variant: FormVariant;
  density: FormDensity;
};

const VARIANTS: FormVariant[] = ['standard', 'outlined', 'filled'];
const DENSITIES: FormDensity[] = ['compact', 'comfortable'];

/** Voreinstellung: v2-Look (kompakt, Unterstrich-Inputs). */
export const DEFAULT_APPEARANCE: FormAppearance = {
  variant: 'standard',
  density: 'compact',
};

/**
 * Liest `options.variant` / `options.density` vom Wurzelelement der UI-Schema
 * eines OverlayForm. Unbekannte Werte werden ignoriert.
 */
export function readFormAppearance(ui: any): FormAppearance {
  const options = (ui && typeof ui === 'object' ? ui.options : undefined) ?? {};

  const variant = VARIANTS.includes(options.variant)
    ? (options.variant as FormVariant)
    : DEFAULT_APPEARANCE.variant;

  const density = DENSITIES.includes(options.density)
    ? (options.density as FormDensity)
    : DEFAULT_APPEARANCE.density;

  return { variant, density };
}

/**
 * Erzeugt aus dem App-Theme ein abgeleitetes Theme für den JSON-Forms-Bereich.
 * Wird als verschachtelter ThemeProvider nur um <JsonForms/> gelegt, damit die
 * App-Chrome (Suchfeld, Buttons) unverändert bleibt.
 */
export function buildFormTheme(base: Theme, appearance: FormAppearance): Theme {
  const { variant, density } = appearance;
  const compact = density === 'compact';

  return createTheme(base, {
    components: {
      // steuert JSON Forms' Input-Komponente (Input | FilledInput | OutlinedInput)
      MuiTextField: {
        defaultProps: { variant },
      },

      ...(compact && variant !== 'standard'
        ? {
            MuiInputBase: {
              defaultProps: { size: 'small' as const },
            },
          }
        : {}),

      ...(compact
        ? {
            // Tabellenzeilen der Array-Darstellung (MaterialTableControl)
            MuiTableCell: {
              styleOverrides: {
                root: {
                  paddingTop: 2,
                  paddingBottom: 2,
                  paddingLeft: 8,
                  paddingRight: 8,
                },
                head: {
                  paddingTop: 4,
                  paddingBottom: 4,
                  whiteSpace: 'nowrap' as const,
                },
              },
            },

            // JSON Forms rendert pro Zelle/Control immer FormHelperText-Elemente,
            // auch wenn sie leer sind -> ~20px pro Zeile ohne Inhalt.
            MuiFormHelperText: {
              styleOverrides: {
                root: {
                  marginTop: 0,
                  marginBottom: 0,
                  '&:empty': { display: 'none' },
                },
              },
            },

            // Add/Delete/Sort-Buttons der Tabelle nutzen size="large"
            MuiIconButton: {
              styleOverrides: {
                sizeLarge: { padding: 6 },
              },
            },

            // Überschrift der Array-Toolbar
            MuiTypography: {
              styleOverrides: {
                h6: { fontSize: '1rem', lineHeight: 1.4 },
              },
            },

            MuiFormControl: {
              styleOverrides: {
                root: { marginTop: 0, marginBottom: 0 },
              },
            },
          }
        : {}),
    },
  });
}
