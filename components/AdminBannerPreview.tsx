import Image from 'next/image'

type Props = {
  title: string
  text: string
  image: string
  gradient: string
  theme: 'dark' | 'light'
  preview: 'desktop' | 'mobile'
}

export default function AdminBannerPreview({
  title,
  text,
  image,
  gradient,
  theme,
  preview,
}: Props) {
  const dark = theme === 'dark'

  return (
    <div
      style={{
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
        height: preview === 'mobile' ? 420 : 260,
        background: gradient,
        position: 'relative',
      }}
    >
      <Image
        src={image}
        alt="preview"
        fill
        style={{ objectFit: 'contain' }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            90deg,
            ${gradient}dd 0%,
            ${gradient}88 45%,
            transparent 75%
          )`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          color: dark ? '#fff' : '#111',
          maxWidth: 420,
        }}
      >
        <h3>{title || 'Banner title'}</h3>
        <p>{text || 'Banner description'}</p>
      </div>
    </div>
  )
}
``
