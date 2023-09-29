import { Modules } from '@kaetram/common/network';
import { Hits } from '@kaetram/common/network/modules';

interface Colour {
    fill: string;
    stroke: string;
    inflicted?: Colour;
}

interface Colours {
    [key: string]: Colour;
}

export default class Splat {
    public opacity = 1;
    public skillKey = '';

    private text = '';
    private prefix = '';
    private suffix = '';
    private lastTime = 0;
    private speed = 100;
    private updateY = 1;
    private duration = 1000;
    private colour: Colour = Modules.DamageColours[Hits.Normal];

    public fill = 'rgb(255, 50, 50)';
    public stroke = 'rgb(255, 180, 180)';

    private destroyCallback?: (id: string) => void;

    public constructor(
        public id: string,
        public type: Modules.Hits,
        public value: number,
        public x: number,
        public y: number,
        isTarget = false,
        skill = -1,
        public skills: string[] = []
    ) {
        this.text = `${value}`;
        this.updateY = this.isHeal() ? 2 : 1;
        this.duration = this.isHeal() ? 400 : 1000;
        this.colour = (Modules.DamageColours as Colours)[type] || this.colour;

        if (skill > -1) {
            this.colour = (Modules.SkillExpColours as Colours)[skill];
            this.skillKey = `skills/${Modules.Skills[skill].toLowerCase()}`;
        }

        // Prefix the skills sprite folder so we can load the icon.
        for (let i = 0; i < skills.length; i++) skills[i] = `skills/${skills[i]}`;

        this.fill = this.colour?.fill || this.fill;
        this.stroke = this.colour?.stroke || this.stroke;

        if (isTarget && this.hasInflicted()) {
            this.fill = this.colour.inflicted!.fill;
            this.stroke = this.colour.inflicted!.stroke;
        }

        // Text gets marked as MISS if this is a damage type and the value is 0.
        if (this.isDamage() && value < 1) {
            this.text = 'MISS';
            this.skills = []; // Don't render any skills if the hit is a miss.
        }

        if (this.isPoison() || this.isFreezing()) this.prefix = '--';
        if (this.isPoints()) this.prefix = '++';

        if (this.isExperience()) {
            this.prefix = '+';
            this.suffix = 'EXP';
        }
    }

    /**
     * Updates the current time of the splat.
     * @param time The game time from the game loop.
     */

    public update(time: number): void {
        if (time - this.lastTime > this.speed) {
            this.y -= this.updateY;

            this.lastTime = time;

            this.opacity -= 70 / this.duration;

            if (this.opacity < 0) this.destroyCallback?.(this.id);
        }
    }

    /**
     * @returns Concatenated text with prefix, text, and suffix.
     */

    public getText(): string {
        return `${this.prefix}${this.text} ${this.suffix}`;
    }

    /**
     * Checks if the type of the splat is a heal type.
     * @returns Whether the type equals the enum Heal.
     */

    private isHeal(): boolean {
        return this.type === Modules.Hits.Heal;
    }

    /**
     * Checks if the splat type is a poison.
     * @returns Whether the type equals the enum Poison.
     */

    private isPoison(): boolean {
        return this.type === Modules.Hits.Poison;
    }

    /**
     * Checks whether the hit type is that of cold damage.
     * @returns Whether or not the splat type is cold.
     */

    private isFreezing(): boolean {
        return this.type === Modules.Hits.Freezing;
    }

    /**
     * Checks if the splat type is that of experience of profession. We
     * separate these two since their prefix contains a '+' and suffix a 'EXP';
     * @returns Whether the type equals the enum Experience or Profession.
     */

    private isExperience(): boolean {
        return this.type === Modules.Hits.Experience || this.type === Modules.Hits.Profession;
    }

    /**
     * Separate the heal and mana types since their prefix is '++';
     * @returns Whether the type equals the enum Heal or Mana.
     */

    private isPoints(): boolean {
        return this.type === Modules.Hits.Heal || this.type === Modules.Hits.Mana;
    }

    /**
     * Damage types are characterized by combat related splats.
     * When the splat is a damage type, we can replace the text
     * with `MISS` should the value be undefined or less than 1.
     * @returns Whether the type of the splat is a damage type.
     */

    private isDamage(): boolean {
        return (
            this.type === Modules.Hits.Normal ||
            this.type === Modules.Hits.Stun ||
            this.type === Modules.Hits.Critical ||
            this.type === Modules.Hits.Explosive
        );
    }

    /**
     * Checks if the current colour hsa a inflicted property.
     * @returns Whether the inflicted property is defined.
     */

    private hasInflicted(): boolean {
        return this.colour.inflicted !== undefined;
    }

    /**
     * Callback for when the info is destroyed.
     * @param callback Callback containing the id of the info.
     */

    public onDestroy(callback: (id: string) => void): void {
        this.destroyCallback = callback;
    }
}
