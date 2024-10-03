export default function Loader(props) {
  const color = props.color || '#FFF';
  const size = props.size || '48px';
  return (
    <div
      className="loader"
      style={{
        borderColor: color,
        borderBottomColor: 'transparent',
        width: size,
        height: size
      }}
    >
    </div>
  )
}