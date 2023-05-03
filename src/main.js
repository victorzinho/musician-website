import 'bootstrap/dist/js/bootstrap.esm.min';
import 'bootstrap/dist/css/bootstrap.min.css';

import './navigation';
import './about';
import scores from '../contents/scores';
import { addPortfolioElement } from './portfolio';

import './styles';

scores.forEach(addPortfolioElement);

document.querySelector('header').style.opacity = '1';
