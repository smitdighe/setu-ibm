/**
 * NCERT Grade 6 curriculum map — subject → ordered topic list (prerequisite order).
 * Used by RecommendationAgent engine.ts to sort weak topics by curriculum position.
 *
 * Sources: NCERT Class 6 Mathematics and Science syllabi.
 */

import type { CurriculumMap } from "@/types/entities";

export const curriculumMap: CurriculumMap = {
  math: [
    "natural_numbers",
    "whole_numbers",
    "integers",
    "fractions",
    "decimals",
    "basic_geometry",
    "understanding_shapes",
    "mensuration",
    "algebra_intro",
    "ratio_proportion",
    "symmetry",
    "data_handling",
  ],
  science: [
    "food_sources",
    "components_of_food",
    "fibre_to_fabric",
    "sorting_materials",
    "separation_of_substances",
    "changes_around_us",
    "living_world",
    "body_movements",
    "living_organisms_habitats",
    "motion_and_measurement",
    "light_shadows_reflections",
    "electricity_circuits",
    "magnets",
    "water",
    "air_around_us",
    "garbage_in_garbage_out",
  ],
};
