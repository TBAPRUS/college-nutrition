import { Button } from "@mui/material";

export default function LoadingButton (props) {
  const loading = props.loading || false;
  
  const disabled = loading || props.disabled || false;
  const children = loading
    ? 'Загрузка...'
    : props.children

  const toPass = {
    ...props,
    loading: undefined
  }

  return (
    <Button
      {...toPass}
      disabled={disabled}
      children={children}
    />
  )
}