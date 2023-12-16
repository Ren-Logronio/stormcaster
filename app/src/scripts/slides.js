
var isSliderInTransition = false;
var sliderIndex = 1;
const sliderMinIndex = 1;
const sliderMaxIndex = 6;
const speed = 0.9;

const jumpSlide = (sliderIndexToJumpTo) => {
    if (sliderIndexToJumpTo < sliderMinIndex || sliderIndexToJumpTo > sliderMaxIndex || sliderIndex == sliderIndexToJumpTo || isSliderInTransition) {
        return;
    }
    var currentSliderAnimation;
    var nextSliderAnimation;
    if(sliderIndex > sliderIndexToJumpTo) {
        currentSliderAnimation = "animate__fadeOutRight";
        nextSliderAnimation = "animate__fadeInLeft";
    } else if(sliderIndex < sliderIndexToJumpTo) {
        currentSliderAnimation = "animate__fadeOutLeft";
        nextSliderAnimation = "animate__fadeInRight";
    }
    isSliderInTransition = true;
    var currentSlide = document.querySelector(`#slide-${sliderIndex}`);
    var currentSliderItem = document.querySelector(`#slider-item-${sliderIndex}`);
    var nextSlide = document.querySelector(`#slide-${sliderIndexToJumpTo}`);
    var nextSliderItem = document.querySelector(`#slider-item-${sliderIndexToJumpTo}`);

    currentSliderItem.classList.remove('active');
    nextSliderItem.classList.add('active');
    if(sliderIndexToJumpTo == sliderMaxIndex) {
        elementHook.nextSlidebutton.classList.add('disabled');
    } else {
        elementHook.nextSlidebutton.classList.remove('disabled');
    } 
    if(sliderIndexToJumpTo == sliderMinIndex) {
        elementHook.previousSlidebutton.classList.add('disabled');
    } else {
        elementHook.previousSlidebutton.classList.remove('disabled');
    }

    currentSlide.classList.add(currentSliderAnimation);
    setTimeout(() => {
        currentSlide.classList.add('d-none');
        currentSlide.classList.remove(currentSliderAnimation);
        nextSlide.classList.remove('d-none');
        nextSlide.classList.add(nextSliderAnimation);
        setTimeout(() => {
            nextSlide.classList.remove(nextSliderAnimation);
        }, speed * 1000);
        
        if(sliderIndexToJumpTo == sliderMinIndex) {
            elementHook.slider.classList.add('animate__fadeOutUp');
            setTimeout(() => {
                elementHook.slider.classList.add('d-none');
                elementHook.slider.classList.remove('animate__fadeOutUp');
            }, speed * 1000);
        } else if (sliderIndex == sliderMinIndex) {
            elementHook.slider.classList.remove('d-none');
            elementHook.slider.classList.add('d-flex');
            elementHook.slider.classList.add('animate__fadeInDown');
            setTimeout(() => {
                elementHook.slider.classList.remove('animate__fadeInDown');
            }, speed * 1000);
        }
        sliderIndex = sliderIndexToJumpTo;
    }, speed * 1000);
    setTimeout(() => {
        isSliderInTransition = false;
    }, speed * 2000);
    return `Transitioned from ${sliderIndex} to ${sliderIndexToJumpTo}`;
}

const previousSlide = () => {
    jumpSlide(sliderIndex - 1);
}

const nextSlide = () => {
    jumpSlide(sliderIndex + 1);
}

const initializeSlides = () => {
    const uploadButton = document.querySelector('#upload-button');
    const slider = document.querySelector('#slider');
        const sliderItem2 = document.querySelector('#slider-item-2');
        const sliderItem3 = document.querySelector('#slider-item-3');
        const sliderItem4 = document.querySelector('#slider-item-4');
        const sliderItem5 = document.querySelector('#slider-item-5');
    const slide1 = document.querySelector('#slide-1');
    const slide2 = document.querySelector('#slide-2');
    const nextSlidebutton = document.querySelector('#next-slide-button');
    const previousSlidebutton = document.querySelector('#previous-slide-button');
    elementHook = {
        ...elementHook,
        uploadButton: uploadButton,
        slider: slider,
            sliderItem2: sliderItem2,
            sliderItem3: sliderItem3,
            sliderItem4: sliderItem4,
            sliderItem5: sliderItem5,
        slide1: slide1,
        slide2: slide2,
        nextSlidebutton: nextSlidebutton,
        previousSlidebutton: previousSlidebutton,
    }
    elementHook.inputs.push(uploadButton, nextSlidebutton, previousSlidebutton);
    uploadButton.addEventListener('click', nextSlide);
    nextSlidebutton.addEventListener('click', nextSlide);
    previousSlidebutton.addEventListener('click', previousSlide);
}

