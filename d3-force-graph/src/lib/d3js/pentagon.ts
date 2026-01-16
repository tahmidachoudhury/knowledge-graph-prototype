export default function pentagonPath(size: number) {
  const angle = (Math.PI * 2) / 5;
  let path = "";
  for (let i = 0; i < 5; i++) {
    const x = size * Math.cos(i * angle - Math.PI / 2);
    const y = size * Math.sin(i * angle - Math.PI / 2);
    path += (i === 0 ? "M" : "L") + x + "," + y;
  }
  return path + "Z";
}
