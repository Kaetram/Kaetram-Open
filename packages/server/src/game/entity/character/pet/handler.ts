import type Pet from './pet';

export default class Handler {
    public constructor(protected pet: Pet) {
        //this.pet.onMovement(this.handleMovement.bind(this));
    }
}
