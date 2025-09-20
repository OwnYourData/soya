import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  FormControl, InputLabel, Select, MenuItem, Chip, Input,
  FormHelperText, Checkbox, ListItemText
} from '@material-ui/core';
import { useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';

interface SelectItem {
  value: string;
  text: string;
}

const useStyles = makeStyles((theme) => ({
  formControl: { margin: theme.spacing(1), width: '100%' },
  chips: { display: 'flex', flexWrap: 'wrap' },
  chip: { margin: 2 },
}));

const MultiSelect = (props: ControlProps & { readonly?: boolean }) => {
  const classes = useStyles();

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
    readonly: roProp,
  } = props as any;

  const getItems = useCallback((): SelectItem[] => {
    // support both `enum` and `oneOf`
    const items: any[] | undefined = (schema as any).enum || (schema as any).oneOf;
    if (!items) return [];
    return items.map((x: any) => ({
      text: x?.title ?? x,
      value: x?.const ?? x,
    }));

    // TODO: re-enable sorting once it's specified how to correctly sort the items
    // return sort(items, x => x.title ?? x).map(x => ({
    //   text: x.title ?? x,
    //   value: x.const ?? x,
    // }));
  }, [schema]);

  const items = getItems();

  // readOnly & enabled zusammenführen
  const isReadOnly =
    roProp === true ||
    (uischema?.options && uischema.options.readonly === true) ||
    (schema && (schema as any).readOnly === true);

  const disabled = !enabled || isReadOnly;

  if (!visible) {
    return null;
  }

  const handleSelectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (disabled) return;
    handleChange(path, event.target.value);
  };

  return (
    <FormControl id={id} className={classes.formControl} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={data}
        onChange={handleSelectChange}
        input={<Input id={`${id}-select-multiple-chip`} />}
        renderValue={(selected) => (
          <div className={classes.chips}>
            {(selected as string[]).map((val) => {
              const { value, text } = items.find((x) => x.value === val) as SelectItem;
              return <Chip key={value} label={text} className={classes.chip} />;
            })}
          </div>
        )}
        MenuProps={{ getContentAnchorEl: null }}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {items.map(({ value, text }) => (
          <MenuItem key={value} value={value} disabled={disabled}>
            <Checkbox
              checked={Array.isArray(data) && data.indexOf(value) !== -1}
              disabled={disabled}
            />
            <ListItemText primary={text} />
          </MenuItem>
        ))}
      </Select>
      {description ? <FormHelperText>{description}</FormHelperText> : null}
    </FormControl>
  );
};

export default withJsonFormsControlProps(MultiSelect);