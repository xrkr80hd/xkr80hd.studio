# Ultimate Game Night broadcast direction

Electric cobalt set, champagne gold scores, cyan turn lights, white question typography. Motion accents announce a new clue and the active team, with reduced motion supported. Public displays contain no private answers before reveal.

The public display scales in viewport-height units instead of stopping at a 1920px width cap. At 1980×1020, categories are approximately 27px, values 52px, questions 59px, scores 49px, team names 24px. At 3840×2160 these scale to approximately 56px, 110px, 125px, 104px and 52px respectively. Screen inches and viewing distance require a real display check; pixel screenshots cannot certify across-room readability.

The six-column board uses five 7.55vh value rows and a 7.1vh category header. Turn instruction and score rail remain in the same display. Optional broadcast sidebar receives a permanent join QR and full player roster through application markup. Names wrap instead of truncating. Public layout supports two to six teams and ten current players. Extremely long names and questions remain content constraints and require editorial review.

Phones use a readable turn card, category choices with large tap targets, and a tactile gold buzzer that becomes slate when locked. Private Game Master controls use the same palette with compact cards and clear primary actions.

Verification: root integration must capture mobile, desktop, 1980×1020 and 3840×2160 board, clue, reveal and lobby states. Check six teams/ten players, long category names, long team/player names, picture clue and permitted music playback. CSS alone does not demonstrate a complete game flow.
