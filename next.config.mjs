<div style={{ width: 90, height: 90, position: 'relative' }}>
  {imageUrl ? (
    <Image
      src={imageUrl}
      alt={item.name}
      fill
      sizes="90px"
      style={{ objectFit: 'cover', borderRadius: 6 }}
    />
  ) : (
    <div
      style={{
        width: 90,
        height: 90,
        background: '#e5e7eb',
        borderRadius: 6,
      }}
    />
  )}
</div>
``
