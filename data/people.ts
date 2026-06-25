import { Person, PersonRole } from "../types/person";

const firstNames = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Barbara", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah",
  "Thomas", "Karen", "Charles", "Lisa",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin",
];

const officeNames = [
  "Riverfront Tower", "Lakeside Center", "Pinnacle Plaza", "Meridian Hub",
  "Nexus Building", "Harbor Office Park", "Summit Campus", "Crossroads Center",
  "Westgate Complex", "Northpoint Tower", "Eastview Plaza", "Southbank Office",
  "Innovation Center", "Parkway Business Park", "Skyline Tower",
  "Metro Office Park", "Creekside Campus", "Grand Avenue Center",
  "Highpoint Building", "Bayside Office Complex",
];

const cities = [
  "Springfield", "Riverside", "Georgetown", "Franklin", "Clinton",
  "Madison", "Salem", "Fairview", "Greenville", "Bristol",
  "Ashland", "Burlington", "Clayton", "Florence", "Lincoln",
];

const states = [
  "AL", "AZ", "CA", "CO", "FL", "GA", "IL", "NY", "OH", "TX",
];

const VP_TITLES = [
  "Chief Executive Officer", "Chief Technology Officer", "VP of Engineering",
  "VP of Sales", "VP of Marketing", "VP of Operations", "VP of Product",
  "Chief Financial Officer", "Chief Operating Officer", "VP of People",
];

const LEADER_TITLES = [
  "Director of Engineering", "Director of Product", "Senior Director",
  "Group Engineering Manager", "Director of Operations", "Director of Sales",
  "Director of Marketing", "Director of Finance", "Director of Design",
  "Principal Program Manager",
];

const MANAGER_TITLES = [
  "Engineering Manager", "Product Manager", "Team Lead",
  "Senior Manager", "Project Manager", "Scrum Master",
  "Technical Program Manager", "Delivery Manager",
];

const IC_TITLES = [
  "Programmer", "Planner", "Tester", "Technical Writer",
  "Software Engineer", "Designer", "Data Analyst", "DevOps Engineer",
  "Business Analyst", "Frontend Developer", "Backend Developer",
  "QA Engineer", "Systems Analyst", "Database Administrator",
];

function getRole(i: number): PersonRole {
  const n = i % 20;
  if (n === 0)                 return "VP";
  if (n === 5 || n === 10)    return "Leader";
  if (n >= 1 && n <= 4)       return "Manager";
  return "IC";
}

function getTitle(i: number, role: PersonRole): string {
  switch (role) {
    case "VP":      return VP_TITLES[i % VP_TITLES.length];
    case "Leader":  return LEADER_TITLES[i % LEADER_TITLES.length];
    case "Manager": return MANAGER_TITLES[i % MANAGER_TITLES.length];
    case "IC":      return IC_TITLES[i % IC_TITLES.length];
  }
}

function generatePeople(count: number): Person[] {
  const people: Person[] = [];

  for (let i = 0; i < count; i++) {
    const id = i + 1;
    const role = getRole(i);
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const city = cities[i % cities.length];
    const state = states[i % states.length];
    const office = officeNames[i % officeNames.length];

    const phoneDigits = (i % 10000).toString().padStart(4, "0");
    const phoneMiddle = Math.floor(i / 10000) % 1000;
    const phoneMiddleStr = phoneMiddle.toString().padStart(3, "0");
    const phone = `(555) ${phoneMiddleStr}-${phoneDigits}`;

    people.push({
      id,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${id}@example.com`,
      phone,
      office,
      city,
      state,
      role,
      title: getTitle(i, role),
    });
  }

  return people;
}

export const PEOPLE_DATA: Person[] = generatePeople(10000);
