import Icon from "./Icon";

export default function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="toast">
      <Icon name="check"/>
      {msg}
    </div>
  );
}
