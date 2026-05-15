import './GalleryModal.css'
import { useEffect } from 'react'



export default function GalleryModal({
    isOpen,
    title,
    images,
    activeIndex,
    onChangeIndex,
    onClose,
}) {
    const galleryImages = images || []

    const showPrevImage = () => {
        if (!galleryImages.length) return

        onChangeIndex(
            activeIndex === 0
                ? galleryImages.length - 1
                : activeIndex - 1
        )
    }

    const showNextImage = () => {
        if (!galleryImages.length) return

        onChangeIndex(
            activeIndex === galleryImages.length - 1
                ? 0
                : activeIndex + 1
        )
    }

    useEffect(() => {
        if (!isOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose()
            }

            if (event.key === 'ArrowLeft') {
                showPrevImage()
            }

            if (event.key === 'ArrowRight') {
                showNextImage()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, activeIndex, galleryImages.length])

    if (!isOpen || !galleryImages.length) {
        return null
    }

    return (
        <div className="gallery-modal" onClick={onClose}>
            <div
                className="gallery-modal-content"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="gallery-modal-top">
                    <div>
                        <h3>{title}</h3>

                        <span>
                            {activeIndex + 1} / {galleryImages.length}
                        </span>
                    </div>

                    <button
                        className="gallery-modal-close"
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть галерею"
                    >
                        ×
                    </button>
                </div>

                <div className="gallery-modal-view">
                    <button
                        className="gallery-modal-arrow gallery-modal-arrow-left"
                        type="button"
                        onClick={showPrevImage}
                        aria-label="Предыдущее фото"
                    >
                        ‹
                    </button>

                    <img
                        src={galleryImages[activeIndex]?.image_url}
                        alt={`${title} фото ${activeIndex + 1}`}
                    />

                    <button
                        className="gallery-modal-arrow gallery-modal-arrow-right"
                        type="button"
                        onClick={showNextImage}
                        aria-label="Следующее фото"
                    >
                        ›
                    </button>
                </div>

                <div className="gallery-modal-thumbs">
                    {galleryImages.map((image, index) => (
                        <button
                            key={image.id}
                            className={`gallery-modal-thumb ${
                                index === activeIndex
                                    ? 'gallery-modal-thumb-active'
                                    : ''
                            }`}
                            type="button"
                            onClick={() => onChangeIndex(index)}
                        >
                            <img
                                src={image.image_url}
                                alt={`${title} миниатюра ${index + 1}`}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}