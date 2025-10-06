import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Input,
  FormHelperText,
  Checkbox,
  ListItemText,
  Divider
} from '@material-ui/core';
import React, { useCallback, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

interface SelectItem {
  value: string;
  text: string;
}

const useStyles = makeStyles((theme) => ({
  formControl: { margin: theme.spacing(1), width: '100%' },
  chips: { display: 'flex', flexWrap: 'wrap' },
  chip: { margin: 2 },
  closeItem: { justifyContent: 'center', fontWeight: 600 }
}));

const MultiSelect = (props: ControlProps & { readonly?: boolean }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const {
    id,
    schema,
    uischema,
    label,
    description,
    handleChange,
    path,
    data = [],
    enabled = true,
    visible = true,
    readonly: roProp
  } = props as any;

  const getItems = useCallback((): SelectItem[] => {
    // support both `enum` and `oneOf`
    const raw: any[] | undefined = (schema as any)?.enum || (schema as any)?.oneOf;
    if (!raw) return [];
    return raw.map((x: any) => ({
      text: x?.title ?? x,
      value: x?.const ?? x
    }));
  }, [schema]);

  const items = getItems();

  // readOnly & enabled zusammenführen
  const isReadOnly =
    roProp === true ||
    (uischema?.options && uischema.options.readonly === true) ||
    (schema && (schema as any).readOnly === true);

  const disabled = !enabled || isReadOnly;

  if (!visible) return null;

  // onChange robust: ignoriert das Close-Item
  const handleSelectChange = (
    event: React.ChangeEvent<{ value: unknown }>,
    child?: React.ReactNode
  ) => {
    if ((child as any)?.props?.['data-close'] === true) {
      // Klick auf "Close" -> keine Wertänderung
      return;
    }
    if (disabled) return;
    handleChange(path, event.target.value);
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    // verhindert, dass der Select das Item als Auswahl interpretiert
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };

  return (
    <FormControl id={id} className={classes.formControl} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={Array.isArray(data) ? data : []}
        onChange={handleSelectChange}
        input={<Input id={`${id}-select-multiple-chip`} />}
        renderValue={(selected) => (
          <div className={classes.chips}>
            {(selected as string[]).map((val) => {
              const item = items.find((x) => x.value === val);
              const label = item ? item.text : String(val);
              return <Chip key={String(val)} label={label} className={classes.chip} />;
            })}
          </div>
        )}
        // Hinweis: in MUI v5 getContentAnchorEl entfernen
        MenuProps={{ getContentAnchorEl: null }}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {items.map(({ value, text }) => (
          <MenuItem key={String(value)} value={value} disabled={disabled}>
            <Checkbox
              checked={Array.isArray(data) && data.indexOf(value) !== -1}
              disabled={disabled}
            />
            <ListItemText primary={text} />
          </MenuItem>
        ))}

        <Divider />

        {/* Close-Eintrag: kein value setzen! */}
        <MenuItem
          data-close
          onClick={handleCloseClick}
          onMouseDown={(e) => e.preventDefault()} // verhindert Fokus-/Auswahl-Seitenwirkung
          className={classes.closeItem}
          dense
          role="button"
          aria-label="Close menu"
        >
          Close
        </MenuItem>
      </Select>

      {description ? <FormHelperText>{description}</FormHelperText> : null}
    </FormControl>
  );
};

export default withJsonFormsControlProps(MultiSelect);