import axios from 'axios';
import Notiflix from 'notiflix';
import * as imagesApi from './pixabay-api.js';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import _ from 'lodash';

const refs = {
  form: document.querySelector('#search-form'),
  gallery: document.querySelector('.gallery'),
  submitBtn: document.querySelector('.submit-btn'), //doesn't work for some reason:/
};
let page = 1;
let loading = false;
let loadedImages = 20;

refs.form.addEventListener('submit', handleSubmit);
const modal = new SimpleLightbox('.photo-card a', {
  captionsData: 'alt',
  captionDelay: 250,
});
function scrollSmoothly() {
  const { height: cardHeight } =
    refs.gallery.firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  refs.form.elements[1].disabled = true;
  refs.gallery.innerHTML = '';
  page = 1;
  loading = false;
  loadedImages = 20;
  window.addEventListener('scroll', _.throttle(handleScroll, 1000));
  try {
    const response = await imagesApi.getImages(refs.form.elements[0].value);
    if (response.data.total <= 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      refs.form.elements[1].disabled = true;
      window.removeEventListener('scroll');
      return;
    }
    refs.gallery.insertAdjacentHTML(
      'beforeend',
      createGalleryMarkup(response.data.hits)
    );
    modal.refresh();
    refs.form.elements[1].disabled = false;
  } catch (error) {
    Notiflix.Notify.failure('Something went wrong, please, reload the page!');
    refs.form.elements[1].disabled = false;
  }
}

function handleScroll() {
  if (loading) return;
  if (window.scrollY + window.innerHeight >= refs.gallery.scrollHeight) {
    loading = true;
    page += 1;
    imagesApi.getImages(refs.form.elements[0].value, page).then(({ data }) => {
      refs.gallery.insertAdjacentHTML(
        'beforeend',
        createGalleryMarkup(data.hits)
      );
      modal.refresh();
      scrollSmoothly();
      loadedImages += 20;
      if (loadedImages + 20 >= data.totalHits) {
        Notiflix.Notify.success(
          `We're sorry, but you've reached the end of search results.`
        );
        imagesApi
          .getImages(refs.form.elements[0].value, page + 1)
          .then(({ data }) => {
            refs.gallery.insertAdjacentHTML(
              'beforeend',
              createGalleryMarkup(data.hits)
            );
            modal.refresh();
            scrollSmoothly();
          });
        loading = true;
        window.removeEventListener('scroll', _.throttle(handleScroll, 1000));
        return;
      }
    });
  }
  loading = false;
}

function createGalleryMarkup(imagesObj) {
  return imagesObj
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `<div class="photo-card">
  <a href="${largeImageURL}" class="photo-link-a"><img src="${webformatURL}" alt="${tags}" title="${tags}" class="photo-link-img"/></a>
  <div class="info">
    <p class="info-item">
      <b>Likes</b>
      ${likes}
    </p>
    <p class="info-item">
      <b>Views</b>
      ${views}
    </p>
    <p class="info-item">
      <b>Comments</b>
      ${comments}
    </p>
    <p class="info-item">
      <b>Downloads</b>
      ${downloads}
    </p>
  </div>
</div>`
    )
    .join('');
}
