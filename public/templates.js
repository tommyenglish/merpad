export const templates = {
  flowchart: `flowchart TD
    A[Arrive at Hogwarts] --> B{Sorting Hat Decision}
    B -- Brave --> C[Gryffindor]
    B -- Cunning --> D[Slytherin]
    B -- Wise --> E[Ravenclaw]
    B -- Loyal --> F[Hufflepuff]
    C --> G[Begin Classes]
    D --> G
    E --> G
    F --> G`,

  sequence: `sequenceDiagram
    participant Harry
    participant Hedwig
    participant Ron
    participant Hermione

    Harry->>Hedwig: Write letter to Ron
    activate Hedwig
    Hedwig->>Ron: Deliver letter
    activate Ron
    Ron-->>Hedwig: Write reply
    deactivate Ron
    Hedwig-->>Harry: Return with response
    deactivate Hedwig

    Harry->>Hedwig: Send to Hermione
    activate Hedwig
    Hedwig->>Hermione: Deliver letter
    activate Hermione
    Hermione-->>Hedwig: Detailed reply (3 pages)
    deactivate Hermione
    Hedwig-->>Harry: Exhausted return
    deactivate Hedwig`,

  gantt: `gantt
    title Hogwarts School Year
    dateFormat YYYY-MM-DD
    section First Term
    Welcome Feast           :a1, 2024-09-01, 7d
    Defense Against Dark Arts :a2, after a1, 60d
    Potions Class          :a3, after a1, 60d
    section Halloween
    Troll in Dungeon       :b1, 2024-10-31, 1d
    Saving Hermione        :b2, after b1, 1d
    section Quidditch
    First Match            :c1, 2024-11-15, 1d
    Training Sessions      :c2, 2024-10-01, 90d
    section Christmas
    Winter Break           :d1, 2024-12-20, 14d
    section Final Term
    Exams Preparation      :e1, 2025-05-01, 30d
    Final Exams            :e2, after e1, 7d`,

  class: `classDiagram
    class Wizard {
        +String name
        +String house
        +int magicLevel
        +castSpell()
        +brewPotion()
    }
    class Gryffindor {
        +String trait = "Brave"
        +summonPatronus()
        +defendAgainstDarkArts()
    }
    class Slytherin {
        +String trait = "Cunning"
        +speakParseltongue()
        +masterLegilimency()
    }
    class Ravenclaw {
        +String trait = "Wise"
        +solveRiddles()
        +advancedCharms()
    }
    Wizard <|-- Gryffindor
    Wizard <|-- Slytherin
    Wizard <|-- Ravenclaw

    class Wand {
        +String wood
        +String core
        +choosesWizard()
    }
    Wizard "1" --> "1" Wand : wields`,

  erDiagram: `erDiagram
    STUDENT ||--o{ ENROLLMENT : enrolls
    STUDENT {
        string id PK
        string name
        string house
        int year
        date birthdate
    }
    HOUSE ||--o{ STUDENT : belongs_to
    HOUSE {
        string name PK
        string founder
        string commonRoom
        int points
    }
    COURSE ||--o{ ENROLLMENT : has
    COURSE {
        string id PK
        string name
        string professor
        string classroom
    }
    ENROLLMENT {
        string studentId FK
        string courseId FK
        string grade
        int attendance
    }
    HOUSE ||--o{ QUIDDITCH_TEAM : fields
    QUIDDITCH_TEAM {
        string houseId FK
        string captain
        int wins
    }`,

  state: `stateDiagram-v2
    [*] --> Human
    Human --> Bitten : Werewolf Attack
    Bitten --> Infected : Survive Bite
    Infected --> Transforming : Full Moon Rises
    Transforming --> Werewolf : Complete Transformation
    Werewolf --> Hunting : Night Falls
    Hunting --> Werewolf : Prowling
    Werewolf --> Reverting : Dawn Breaks
    Reverting --> Human : Morning Light
    Human --> Infected : Monthly Cycle
    Infected --> Cured : Drink Wolfsbane Potion
    Cured --> [*]`,

  pie: `pie title House Points Championship
    "Gryffindor" : 482
    "Slytherin" : 472
    "Ravenclaw" : 426
    "Hufflepuff" : 352`,

  gitGraph: `gitGraph
    commit id: "Selected as Champion"
    commit id: "Study dragons"
    branch dragon-task
    checkout dragon-task
    commit id: "Learn Accio spell"
    commit id: "Practice on Firebolt"
    commit id: "Get past Hungarian Horntail"
    checkout main
    merge dragon-task tag: "Golden-Egg"
    commit id: "Decode egg clue"
    branch lake-task
    checkout lake-task
    commit id: "Research gillyweed"
    commit id: "Test breathing underwater"
    commit id: "Save hostages from lake"
    checkout main
    merge lake-task tag: "Second-Place"
    commit id: "Prepare for maze"
    commit id: "Enter maze"
    commit id: "Grab Triwizard Cup"`,

  journey: `journey
    title Harry's First Year at Hogwarts
    section Arrival
      Board Hogwarts Express: 5: Harry, Ron, Hermione
      Cross the Lake: 4: Harry, First Years
      Sorting Ceremony: 3: Harry, Sorting Hat
    section Learning Magic
      First Potions Class: 2: Harry, Snape
      Flying Lessons: 5: Harry, Madam Hooch
      Defense Against Dark Arts: 4: Harry, Professor
    section Adventures
      Troll in Dungeon: 3: Harry, Ron, Hermione
      First Quidditch Match: 5: Harry, Team
      Forbidden Forest: 2: Harry, Detention
    section Final Challenge
      Through the Trapdoor: 3: Harry, Ron, Hermione
      Defeat Voldemort: 4: Harry
      House Cup Victory: 5: Harry, Gryffindor`
};
