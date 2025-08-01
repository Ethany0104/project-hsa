import React, { useState, useEffect } from 'react';

const BackgroundSlideshow = ({ images, isFocused }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
        }, 10000); // 10초마다 이미지 변경

        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) {
        return null;
    }

    // [수정] isFocused 상태에 따라 오버레이 스타일이 바뀌도록 설정합니다.
    const overlayClass = isFocused
        ? 'bg-black/20 backdrop-blur-none' // 집중 모드: 덜 어둡고, 블러 없음
        : 'bg-black/60 backdrop-blur-sm';  // 일반 모드: 더 어둡고, 블러 효과 있음

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {images.map((image, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                    style={{
                        backgroundImage: `url(${image})`,
                        opacity: index === currentIndex ? 1 : 0,
                    }}
                />
            ))}
            {/* [수정] 오버레이 div에 조건부 클래스와 트랜지션 효과를 추가합니다. */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${overlayClass}`}></div>
        </div>
    );
};

export default BackgroundSlideshow;
