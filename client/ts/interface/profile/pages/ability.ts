import $ from 'jquery';
import Page from '../page';

export default class Ability extends Page {
    game: any;
    constructor(game) {
        super('#skillPage');

        this.game = game;
    }
};
