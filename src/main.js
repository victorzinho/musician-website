import 'bootstrap/dist/js/bootstrap.esm.min';
import 'bootstrap/dist/css/bootstrap.min.css';

import './navigation';
import './about';
import compositions from '../contents/compositions';
import playing from '../contents/playing';
import { addComposition, addPlaying } from './portfolio';

import './styles';

compositions.forEach(addComposition);
playing.forEach(addPlaying);
