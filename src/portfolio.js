import Isotope from 'isotope-layout';
import Swal from 'sweetalert2';
import translations from './i18n';

const CSS_CLASS_MUSIC_PLAYER = 'music-player';
const CSS_CLASS_MUSIC_INFO = 'music-info';

const ID_COMPOSITIONS_CONTAINER = 'portfolio-compositions-container';
const ID_PLAYING_CONTAINER = 'portfolio-playing-container';

const FILTER_ID_BY_CONTAINER_ID = {};
FILTER_ID_BY_CONTAINER_ID[ID_COMPOSITIONS_CONTAINER] = 'portfolio-composition-filters';
FILTER_ID_BY_CONTAINER_ID[ID_PLAYING_CONTAINER] = 'portfolio-playing-filters';

const itemContainerById = {};
const isotopeById = {};

[...document.querySelectorAll('.portfolio-container')].forEach(container => {
  itemContainerById[container.id] = container;

  const isotope = new Isotope(container, {
    itemSelector: '.portfolio-item',
    layoutMode: 'fitRows'
  });
  const filters = [...document.querySelectorAll(`#${FILTER_ID_BY_CONTAINER_ID[container.id]} li`)];
  filters.forEach(filter => filter.addEventListener('click', event => {
    event.preventDefault();

    filters.forEach(otherFilter => otherFilter.classList.remove('filter-active'));
    filter.classList.add('filter-active');

    isotope.arrange({ filter: filter.getAttribute('data-filter') });
  }));
  isotopeById[container.id] = isotope;
});

function lang () {
  return window.location.pathname.split('/').filter(x => x).at(-1);
}

function i18n (path) {
  return path.split('.').reduce((prev, curr) => prev?.[curr], translations[lang()]);
}

function popup (button, cssClass, htmlGetter) {
  button.addEventListener('click', () => {
    Swal.fire({
      title: '',
      html: htmlGetter(),
      showConfirmButton: false,
      showCloseButton: true,
      customClass: cssClass
    });
    document.activeElement.blur();
  });
}

function getInfoHtml (scoreDescriptor) {
  let info = '';
  if (scoreDescriptor.duration) {
    info += `<p><span>${i18n('headers.duration')}</span>: ${scoreDescriptor.duration}</p>`;
  }
  if (scoreDescriptor.instrumentation && Object.hasOwn(scoreDescriptor.instrumentation, lang())) {
    info += `<p><span>${i18n('headers.instrumentation')}</span>: ${scoreDescriptor.instrumentation[lang()]}</p>`;
  }
  if (scoreDescriptor.year) {
    info += `<p><span>${i18n('headers.year')}</span>: ${scoreDescriptor.year}</p>`;
  }
  if (scoreDescriptor.descriptionHtml && Object.hasOwn(scoreDescriptor.descriptionHtml, lang())) {
    info += scoreDescriptor.descriptionHtml[lang()];
  }
  return info ? `<h3>${scoreDescriptor.name}</h3>` + info : null;
}

function player (button, scoreDescriptor) {
  if (!button || !scoreDescriptor.playUrl) return;
  popup(button, CSS_CLASS_MUSIC_PLAYER, () => scoreDescriptor.playUrl.includes('soundcloud')
    ? `<iframe width="100%" height="300" allow="autoplay"
         src="https://w.soundcloud.com/player/?url=${scoreDescriptor.playUrl}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>`
    : `<iframe src="${scoreDescriptor.playUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`);
}

function info (button, scoreDescriptor) {
  if (!button) return;
  const infoHtml = getInfoHtml(scoreDescriptor);
  if (!infoHtml) return;
  popup(button, CSS_CLASS_MUSIC_INFO, () => infoHtml);
}

function addElement (id, scoreDescriptor, fallbackImage, buttons) {
  let newItem = document.createElement('div');
  newItem.className = 'mt-4 col-lg-3 col-md-3 portfolio-item filter-' + scoreDescriptor.type;
  newItem.innerHTML = `
  <img src="${scoreDescriptor.image || fallbackImage}" class="img-fluid" alt="">
  <div class="portfolio-info">
     ${scoreDescriptor.name ? '<h3>' + scoreDescriptor.name + '</h3>' : ''}
     <div class="portfolio-buttons">
       ${buttons ? buttons.join() : ''}
     </div>
   </div>`;
  newItem = itemContainerById[id].appendChild(newItem);
  isotopeById[id].insert(newItem);
  return newItem;
}

export function addComposition (scoreDescriptor) {
  const playButtonHtml = scoreDescriptor.playUrl
    ? '<div class="portfolio-play-button"><i class="fi fi-ss-volume"></i></div>'
    : '';
  const scoreButtonHtml = scoreDescriptor.scoreUrl
    ? `<a href="${scoreDescriptor.scoreUrl}" target="_blank">
        <i class="fi fi-ss-document"></i>
      </a>`
    : '';
  const infoHtml = getInfoHtml(scoreDescriptor);
  const infoButtonHtml = infoHtml
    ? '<div class="portfolio-info-button"><i class="fi fi-ss-info"></i></div>'
    : '';

  const element = addElement(ID_COMPOSITIONS_CONTAINER, scoreDescriptor,
    '../images/pf_bg.webp', [playButtonHtml, scoreButtonHtml, infoButtonHtml]);
  player(element.querySelector('.portfolio-play-button'), scoreDescriptor);
  info(element.querySelector('.portfolio-info-button'), scoreDescriptor);
}

export function addPlaying (scoreDescriptor) {
  const element = addElement(ID_PLAYING_CONTAINER, scoreDescriptor, '../images/20230503_222110.jpg');
  player(element, scoreDescriptor);
}

window.addEventListener('load', () => Object.values(isotopeById).forEach(isotope => isotope.layout()));
