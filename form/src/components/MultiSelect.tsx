import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { FormControl, InputLabel, Select, MenuItem, Chip, Input, FormHelperText, Checkbox, ListItemText } from '@material-ui/core';
import { useCallback } from 'react';

import { makeStyles } from '@material-ui/core/styles';

interface SelectItem {
  value: string;
  text: string;
}

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    width: '100%',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
}));

const MultiSelect = (props: ControlProps) => {
  const classes = useStyles();

  let {
    id,
    schema,
    label,
    description,
    handleChange,
    path,
    data = [],
  } = props;

  const getItems = useCallback((): SelectItem[] => {
    // support both `enum` and `oneOf`
    const items: any[] | undefined = schema.enum || schema.oneOf;

    if (!items)
      return [];

    return items.map(x => ({
      text: x.title ?? x,
      value: x.const ?? x,
    }));

    // TODO: re-enable sorting once it's specified how to correctly sort the items
    // return sort(items, x => x.title ?? x).map(x => ({
    //   text: x.title ?? x,
    //   value: x.const ?? x,
    // }));
  }, [schema.enum, schema.oneOf]);

  const items = getItems();

  return <FormControl
    id={id}
    className={classes.formControl}>
    <InputLabel >{label}</InputLabel>
    <Select
      multiple
      value={data}
      onChange={(event) => {
        handleChange(path, event.target.value);
      }}
      input={<Input id="select-multiple-chip" />}
      renderValue={(selected) => (
        <div className={classes.chips}>
          {(selected as string[]).map((val) => {
            const { value, text } = items.find(x => x.value === val) as SelectItem;
            return <Chip key={value} label={text} className={classes.chip} />
          })}
        </div>
      )}
      MenuProps={{
        // https://stackoverflow.com/a/59790471/1517969
        getContentAnchorEl: null,
      }}
    >
      {items.map(({ value, text }) => (
        <MenuItem key={value} value={value}>
          <Checkbox checked={data.indexOf(value) !== -1} />
          <ListItemText primary={text} />
        </MenuItem>
      ))}
    </Select>
    {description ? <FormHelperText>{description}</FormHelperText> : undefined}
  </FormControl>;
}

export default withJsonFormsControlProps(MultiSelect);