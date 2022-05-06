export interface TreeInfo {
    levelRequirement: number; // Required level to cut the tree
    experience: number; // Experience gained when cutting the tree
    difficulty: number; // How hard it is to cut the tree
    item: string; // What you get when you cut the tree
}

export type TreeData = { [key: string]: TreeInfo };
