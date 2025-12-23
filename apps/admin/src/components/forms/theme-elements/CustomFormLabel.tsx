import { styled } from '@mui/material/styles';
import { FormLabel, FormLabelProps } from '@mui/material';

const CustomFormLabel = styled((props: FormLabelProps) => (
  <FormLabel {...props} />
))(() => ({
  marginBottom: '5px',
  marginTop: '25px',
  display: 'block',
  fontWeight: 600,
  fontSize: '0.875rem',
}));

export default CustomFormLabel;
