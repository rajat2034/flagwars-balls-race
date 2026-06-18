// Flag Rally World Cup - Country Database
// Contains 193 UN countries + UK football subdivisions, and maps real-world stats to physics attributes

const COUNTRIES_DATA = [
  { code: "af", name: "Afghanistan", pop: 38.9, gdp: 19.8, mil: 20, tour: 5, hap: 2.5, luck: 45 },
  { code: "al", name: "Albania", pop: 2.8, gdp: 15.3, mil: 30, tour: 40, hap: 5.2, luck: 50 },
  { code: "dz", name: "Algeria", pop: 43.8, gdp: 145.2, mil: 65, tour: 25, hap: 4.9, luck: 55, isWorldCup: true },
  { code: "ad", name: "Andorra", pop: 0.08, gdp: 3.1, mil: 5, tour: 85, hap: 6.5, luck: 60 },
  { code: "ao", name: "Angola", pop: 32.8, gdp: 62.3, mil: 45, tour: 15, hap: 4.4, luck: 48 },
  { code: "ag", name: "Antigua & Barbuda", pop: 0.1, gdp: 1.4, mil: 10, tour: 75, hap: 6.2, luck: 55 },
  { code: "ar", name: "Argentina", pop: 45.3, gdp: 383.1, mil: 55, tour: 60, hap: 6.0, luck: 75, isWorldCup: true, isStrongFootball: true },
  { code: "am", name: "Armenia", pop: 3.0, gdp: 12.6, mil: 40, tour: 30, hap: 5.4, luck: 50 },
  { code: "au", name: "Australia", pop: 25.6, gdp: 1330.8, mil: 70, tour: 80, hap: 7.2, luck: 65, isWorldCup: true },
  { code: "at", name: "Austria", pop: 8.9, gdp: 429.0, mil: 50, tour: 78, hap: 7.2, luck: 58, isWorldCup: true },
  { code: "az", name: "Azerbaijan", pop: 10.1, gdp: 42.6, mil: 52, tour: 35, hap: 5.2, luck: 50 },
  { code: "bs", name: "Bahamas", pop: 0.4, gdp: 11.2, mil: 15, tour: 90, hap: 6.3, luck: 60 },
  { code: "bh", name: "Bahrain", pop: 1.7, gdp: 38.5, mil: 35, tour: 55, hap: 6.1, luck: 55 },
  { code: "bd", name: "Bangladesh", pop: 164.7, gdp: 324.2, mil: 48, tour: 20, hap: 5.0, luck: 52 },
  { code: "bb", name: "Barbados", pop: 0.3, gdp: 4.4, mil: 12, tour: 82, hap: 6.4, luck: 58 },
  { code: "by", name: "Belarus", pop: 9.4, gdp: 60.3, mil: 55, tour: 25, hap: 5.5, luck: 45 },
  { code: "be", name: "Belgium", pop: 11.5, gdp: 521.8, mil: 55, tour: 72, hap: 6.8, luck: 62, isWorldCup: true },
  { code: "bz", name: "Belize", pop: 0.4, gdp: 1.6, mil: 15, tour: 70, hap: 5.9, luck: 55 },
  { code: "bj", name: "Benin", pop: 12.1, gdp: 15.7, mil: 25, tour: 20, hap: 4.8, luck: 47 },
  { code: "bt", name: "Bhutan", pop: 0.8, gdp: 2.4, mil: 10, tour: 45, hap: 6.0, luck: 65 },
  { code: "bo", name: "Bolivia", pop: 11.7, gdp: 36.7, mil: 35, tour: 35, hap: 5.6, luck: 50 },
  { code: "ba", name: "Bosnia & Herzegovina", pop: 3.3, gdp: 20.0, mil: 30, tour: 40, hap: 5.1, luck: 48, isWorldCup: true },
  { code: "bw", name: "Botswana", pop: 2.3, gdp: 15.8, mil: 30, tour: 55, hap: 4.8, luck: 52 },
  { code: "br", name: "Brazil", pop: 212.6, gdp: 1445.0, mil: 68, tour: 65, hap: 6.3, luck: 80, isWorldCup: true, isStrongFootball: true },
  { code: "bn", name: "Brunei", pop: 0.4, gdp: 12.0, mil: 28, tour: 30, hap: 6.0, luck: 55 },
  { code: "bg", name: "Bulgaria", pop: 6.9, gdp: 69.9, mil: 45, tour: 58, hap: 5.1, luck: 50 },
  { code: "bf", name: "Burkina Faso", pop: 20.9, gdp: 17.4, mil: 30, tour: 12, hap: 4.6, luck: 45 },
  { code: "bi", name: "Burundi", pop: 11.9, gdp: 3.3, mil: 25, tour: 8, hap: 3.8, luck: 40 },
  { code: "kh", name: "Cambodia", pop: 16.7, gdp: 25.3, mil: 32, tour: 50, hap: 4.8, luck: 50 },
  { code: "cm", name: "Cameroon", pop: 26.5, gdp: 39.8, mil: 40, tour: 22, hap: 5.1, luck: 55 },
  { code: "ca", name: "Canada", pop: 38.0, gdp: 1644.0, mil: 65, tour: 78, hap: 7.0, luck: 60, isWorldCup: true },
  { code: "cv", name: "Cabo Verde", pop: 0.6, gdp: 1.7, mil: 12, tour: 65, hap: 5.8, luck: 55, isWorldCup: true },
  { code: "cf", name: "Central African Rep.", pop: 4.8, gdp: 2.3, mil: 18, tour: 6, hap: 3.5, luck: 38 },
  { code: "td", name: "Chad", pop: 16.4, gdp: 10.1, mil: 35, tour: 8, hap: 4.0, luck: 42 },
  { code: "cl", name: "Chile", pop: 19.1, gdp: 252.9, mil: 55, tour: 62, hap: 6.2, luck: 56 },
  { code: "cn", name: "China", pop: 1402.0, gdp: 14720.0, mil: 92, tour: 70, hap: 5.6, luck: 58 },
  { code: "co", name: "Colombia", pop: 50.9, gdp: 271.3, mil: 55, tour: 58, hap: 6.0, luck: 60, isWorldCup: true },
  { code: "km", name: "Comoros", pop: 0.9, gdp: 1.2, mil: 10, tour: 30, hap: 4.6, luck: 48 },
  { code: "cd", name: "DR Congo", pop: 89.6, gdp: 48.7, mil: 40, tour: 10, hap: 4.2, luck: 45, isWorldCup: true },
  { code: "cg", name: "Republic of Congo", pop: 5.5, gdp: 10.1, mil: 25, tour: 12, hap: 4.8, luck: 46 },
  { code: "cr", name: "Costa Rica", pop: 5.1, gdp: 61.5, mil: 5, tour: 82, hap: 7.1, luck: 65 },
  { code: "ci", name: "Cote d'Ivoire", pop: 26.4, gdp: 61.3, mil: 38, tour: 28, hap: 5.3, luck: 52, isWorldCup: true },
  { code: "hr", name: "Croatia", pop: 4.0, gdp: 57.2, mil: 48, tour: 85, hap: 6.1, luck: 68, isWorldCup: true },
  { code: "cw", name: "Curaçao", pop: 0.16, gdp: 3.1, mil: 10, tour: 60, hap: 6.5, luck: 55, isWorldCup: true },
  { code: "cu", name: "Cuba", pop: 11.3, gdp: 100.0, mil: 50, tour: 68, hap: 5.8, luck: 50 },
  { code: "cy", name: "Cyprus", pop: 1.2, gdp: 24.6, mil: 30, tour: 80, hap: 6.2, luck: 55 },
  { code: "cz", name: "Czech Republic", pop: 10.7, gdp: 245.3, mil: 50, tour: 70, hap: 6.9, luck: 56, isWorldCup: true },
  { code: "dk", name: "Denmark", pop: 5.8, gdp: 356.1, mil: 58, tour: 74, hap: 7.6, luck: 62 },
  { code: "dj", name: "Djibouti", pop: 1.0, gdp: 3.4, mil: 22, tour: 25, hap: 4.6, luck: 48 },
  { code: "dm", name: "Dominica", pop: 0.07, gdp: 0.5, mil: 5, tour: 70, hap: 6.0, luck: 55 },
  { code: "do", name: "Dominican Republic", pop: 10.8, gdp: 78.8, mil: 28, tour: 82, hap: 6.0, luck: 58 },
  { code: "ec", name: "Ecuador", pop: 17.6, gdp: 98.8, mil: 38, tour: 52, hap: 5.9, luck: 52, isWorldCup: true },
  { code: "eg", name: "Egypt", pop: 102.3, gdp: 363.1, mil: 72, tour: 70, hap: 4.3, luck: 52, isWorldCup: true },
  { code: "sv", name: "El Salvador", pop: 6.5, gdp: 24.6, mil: 25, tour: 50, hap: 6.1, luck: 54 },
  { code: "gq", name: "Equatorial Guinea", pop: 1.4, gdp: 10.0, mil: 20, tour: 15, hap: 4.8, luck: 46 },
  { code: "er", name: "Eritrea", pop: 3.5, gdp: 2.1, mil: 45, tour: 10, hap: 3.9, luck: 40 },
  { code: "ee", name: "Estonia", pop: 1.3, gdp: 30.6, mil: 42, tour: 60, hap: 6.2, luck: 55 },
  { code: "sz", name: "Eswatini", pop: 1.2, gdp: 4.0, mil: 18, tour: 35, hap: 4.3, luck: 45 },
  { code: "et", name: "Ethiopia", pop: 115.0, gdp: 96.6, mil: 52, tour: 30, hap: 4.6, luck: 50 },
  { code: "fj", name: "Fiji", pop: 0.9, gdp: 4.5, mil: 20, tour: 78, hap: 6.2, luck: 60 },
  { code: "fi", name: "Finland", pop: 5.5, gdp: 269.6, mil: 60, tour: 65, hap: 7.8, luck: 64 },
  { code: "fr", name: "France", pop: 67.4, gdp: 2630.0, mil: 85, tour: 95, hap: 6.7, luck: 78, isWorldCup: true, isStrongFootball: true },
  { code: "ga", name: "Gabon", pop: 2.2, gdp: 15.6, mil: 25, tour: 28, hap: 4.9, luck: 48 },
  { code: "gm", name: "Gambia", pop: 2.4, gdp: 1.9, mil: 15, tour: 48, hap: 5.0, luck: 50 },
  { code: "ge", name: "Georgia", pop: 3.7, gdp: 15.9, mil: 35, tour: 58, hap: 5.0, luck: 52 },
  { code: "de", name: "Germany", pop: 83.2, gdp: 3846.0, mil: 78, tour: 82, hap: 6.9, luck: 74, isWorldCup: true, isStrongFootball: true },
  { code: "gh", name: "Ghana", pop: 31.1, gdp: 72.4, mil: 35, tour: 40, hap: 5.1, luck: 56, isWorldCup: true },
  { code: "gr", name: "Greece", pop: 10.7, gdp: 189.0, mil: 62, tour: 88, hap: 5.9, luck: 55 },
  { code: "gd", name: "Grenada", pop: 0.1, gdp: 1.0, mil: 5, tour: 74, hap: 6.0, luck: 55 },
  { code: "gt", name: "Guatemala", pop: 16.9, gdp: 77.6, mil: 30, tour: 48, hap: 6.3, luck: 52 },
  { code: "gn", name: "Guinea", pop: 13.1, gdp: 15.4, mil: 28, tour: 15, hap: 4.9, luck: 48 },
  { code: "gw", name: "Guinea-Bissau", pop: 2.0, gdp: 1.4, mil: 18, tour: 18, hap: 4.7, luck: 46 },
  { code: "gy", name: "Guyana", pop: 0.8, gdp: 5.5, mil: 15, tour: 35, hap: 6.0, luck: 55 },
  { code: "ht", name: "Haiti", pop: 11.4, gdp: 13.4, mil: 10, tour: 20, hap: 3.6, luck: 40, isWorldCup: true },
  { code: "hn", name: "Honduras", pop: 9.9, gdp: 23.8, mil: 28, tour: 45, hap: 5.9, luck: 50 },
  { code: "hu", name: "Hungary", pop: 9.8, gdp: 155.8, mil: 45, tour: 65, hap: 5.8, luck: 54 },
  { code: "is", name: "Iceland", pop: 0.4, gdp: 21.7, mil: 5, tour: 80, hap: 7.5, luck: 64 },
  { code: "in", name: "India", pop: 1380.0, gdp: 2620.0, mil: 88, tour: 60, hap: 4.0, luck: 58 },
  { code: "id", name: "Indonesia", pop: 273.5, gdp: 1058.0, mil: 65, tour: 58, hap: 5.3, luck: 55 },
  { code: "ir", name: "Iran", pop: 84.0, gdp: 203.4, mil: 70, tour: 30, hap: 4.8, luck: 52, isWorldCup: true },
  { code: "iq", name: "Iraq", pop: 40.2, gdp: 167.2, mil: 58, tour: 20, hap: 4.7, luck: 50, isWorldCup: true },
  { code: "ie", name: "Ireland", pop: 4.9, gdp: 418.6, mil: 35, tour: 76, hap: 7.2, luck: 66 },
  { code: "il", name: "Israel", pop: 9.2, gdp: 402.0, mil: 82, tour: 50, hap: 7.2, luck: 55 },
  { code: "it", name: "Italy", pop: 59.6, gdp: 1886.0, mil: 72, tour: 92, hap: 6.4, luck: 75 },
  { code: "jm", name: "Jamaica", pop: 2.9, gdp: 13.8, mil: 18, tour: 85, hap: 5.8, luck: 60 },
  { code: "jp", name: "Japan", pop: 126.3, gdp: 5065.0, mil: 80, tour: 84, hap: 6.1, luck: 60, isWorldCup: true },
  { code: "jo", name: "Jordan", pop: 10.2, gdp: 43.7, mil: 48, tour: 62, hap: 5.4, luck: 52, isWorldCup: true },
  { code: "kz", name: "Kazakhstan", pop: 18.8, gdp: 171.0, mil: 55, tour: 38, hap: 6.0, luck: 52 },
  { code: "ke", name: "Kenya", pop: 53.8, gdp: 98.8, mil: 45, tour: 65, hap: 5.0, luck: 54 },
  { code: "ki", name: "Kiribati", pop: 0.1, gdp: 0.2, mil: 5, tour: 40, hap: 6.0, luck: 55 },
  { code: "kp", name: "North Korea", pop: 25.8, gdp: 18.0, mil: 75, tour: 5, hap: 3.5, luck: 35 },
  { code: "kr", name: "South Korea", pop: 51.8, gdp: 1630.0, mil: 82, tour: 72, hap: 5.8, luck: 58, isWorldCup: true },
  { code: "kw", name: "Kuwait", pop: 4.3, gdp: 105.9, mil: 45, tour: 40, hap: 6.1, luck: 55 },
  { code: "kg", name: "Kyrgyzstan", pop: 6.6, gdp: 7.7, mil: 28, tour: 30, hap: 5.5, luck: 50 },
  { code: "la", name: "Laos", pop: 7.3, gdp: 19.1, mil: 25, tour: 38, hap: 5.0, luck: 50 },
  { code: "lv", name: "Latvia", pop: 1.9, gdp: 33.5, mil: 35, tour: 52, hap: 6.0, luck: 54 },
  { code: "lb", name: "Lebanon", pop: 6.8, gdp: 33.3, mil: 32, tour: 55, hap: 4.6, luck: 45 },
  { code: "ls", name: "Lesotho", pop: 2.1, gdp: 1.8, mil: 15, tour: 25, hap: 4.5, luck: 48 },
  { code: "lr", name: "Liberia", pop: 5.1, gdp: 3.0, mil: 15, tour: 15, hap: 4.9, luck: 48 },
  { code: "ly", name: "Libya", pop: 6.9, gdp: 25.4, mil: 38, tour: 10, hap: 5.4, luck: 45 },
  { code: "li", name: "Liechtenstein", pop: 0.04, gdp: 6.1, mil: 5, tour: 68, hap: 7.1, luck: 60 },
  { code: "lt", name: "Lithuania", pop: 2.8, gdp: 55.8, mil: 45, tour: 55, hap: 6.2, luck: 55 },
  { code: "lu", name: "Luxembourg", pop: 0.6, gdp: 73.2, mil: 25, tour: 70, hap: 7.4, luck: 62 },
  { code: "mg", name: "Madagascar", pop: 27.7, gdp: 13.7, mil: 20, tour: 45, hap: 4.4, luck: 50 },
  { code: "mw", name: "Malawi", pop: 19.1, gdp: 11.9, mil: 18, tour: 30, hap: 4.3, luck: 48 },
  { code: "my", name: "Malaysia", pop: 32.4, gdp: 336.7, mil: 55, tour: 75, hap: 5.7, luck: 56 },
  { code: "mv", name: "Maldives", pop: 0.5, gdp: 4.8, mil: 12, tour: 95, hap: 6.2, luck: 62 },
  { code: "ml", name: "Mali", pop: 20.3, gdp: 17.3, mil: 35, tour: 10, hap: 4.7, luck: 46 },
  { code: "mt", name: "Malta", pop: 0.5, gdp: 14.9, mil: 15, tour: 85, hap: 6.6, luck: 58 },
  { code: "mh", name: "Marshall Islands", pop: 0.06, gdp: 0.2, mil: 5, tour: 35, hap: 6.0, luck: 55 },
  { code: "mr", name: "Mauritania", pop: 4.6, gdp: 7.7, mil: 30, tour: 12, hap: 4.4, luck: 47 },
  { code: "mu", name: "Mauritius", pop: 1.3, gdp: 10.9, mil: 15, tour: 80, hap: 6.0, luck: 58 },
  { code: "mx", name: "Mexico", pop: 128.9, gdp: 1076.0, mil: 60, tour: 82, hap: 6.3, luck: 62, isWorldCup: true },
  { code: "fm", name: "Micronesia", pop: 0.1, gdp: 0.4, mil: 5, tour: 45, hap: 6.0, luck: 55 },
  { code: "md", name: "Moldova", pop: 2.6, gdp: 11.9, mil: 22, tour: 25, hap: 5.7, luck: 50 },
  { code: "mc", name: "Monaco", pop: 0.04, gdp: 7.4, mil: 5, tour: 90, hap: 7.2, luck: 70 },
  { code: "mn", name: "Mongolia", pop: 3.3, gdp: 13.1, mil: 32, tour: 30, hap: 5.7, luck: 52 },
  { code: "me", name: "Montenegro", pop: 0.6, gdp: 4.8, mil: 20, tour: 72, hap: 5.5, luck: 52 },
  { code: "ma", name: "Morocco", pop: 36.9, gdp: 112.8, mil: 65, tour: 78, hap: 5.0, luck: 65, isWorldCup: true },
  { code: "mz", name: "Mozambique", pop: 31.3, gdp: 14.0, mil: 25, tour: 25, hap: 4.8, luck: 48 },
  { code: "mm", name: "Myanmar", pop: 54.4, gdp: 76.2, mil: 55, tour: 20, hap: 4.4, luck: 45 },
  { code: "na", name: "Namibia", pop: 2.5, gdp: 10.7, mil: 25, tour: 58, hap: 4.6, luck: 52 },
  { code: "nr", name: "Nauru", pop: 0.01, gdp: 0.1, mil: 2, tour: 10, hap: 5.8, luck: 55 },
  { code: "np", name: "Nepal", pop: 29.1, gdp: 33.7, mil: 30, tour: 55, hap: 5.3, luck: 52 },
  { code: "nl", name: "Netherlands", pop: 17.4, gdp: 912.2, mil: 62, tour: 80, hap: 7.4, luck: 72, isWorldCup: true, isStrongFootball: true },
  { code: "nz", name: "New Zealand", pop: 5.1, gdp: 212.0, mil: 45, tour: 82, hap: 7.2, luck: 64, isWorldCup: true },
  { code: "ni", name: "Nicaragua", pop: 6.6, gdp: 12.6, mil: 25, tour: 42, hap: 5.8, luck: 50 },
  { code: "ne", name: "Niger", pop: 24.2, gdp: 13.7, mil: 28, tour: 10, hap: 5.0, luck: 46 },
  { code: "ng", name: "Nigeria", pop: 206.1, gdp: 432.3, mil: 60, tour: 30, hap: 4.8, luck: 58 },
  { code: "mk", name: "North Macedonia", pop: 2.1, gdp: 12.2, mil: 25, tour: 45, hap: 5.1, luck: 50 },
  { code: "no", name: "Norway", pop: 5.4, gdp: 362.0, mil: 65, tour: 75, hap: 7.4, luck: 64, isWorldCup: true },
  { code: "om", name: "Oman", pop: 5.1, gdp: 76.3, mil: 52, tour: 55, hap: 6.1, luck: 55 },
  { code: "pk", name: "Pakistan", pop: 220.9, gdp: 263.7, mil: 80, tour: 28, hap: 4.8, luck: 52 },
  { code: "pw", name: "Palau", pop: 0.02, gdp: 0.3, mil: 2, tour: 78, hap: 6.0, luck: 55 },
  { code: "pa", name: "Panama", pop: 4.3, gdp: 52.9, mil: 10, tour: 72, hap: 6.2, luck: 58, isWorldCup: true },
  { code: "pg", name: "Papua New Guinea", pop: 8.9, gdp: 23.6, mil: 20, tour: 30, hap: 5.0, luck: 50 },
  { code: "py", name: "Paraguay", pop: 7.1, gdp: 35.3, mil: 30, tour: 32, hap: 5.7, luck: 54, isWorldCup: true },
  { code: "pe", name: "Peru", pop: 33.0, gdp: 202.0, mil: 48, tour: 64, hap: 5.7, luck: 54 },
  { code: "ph", name: "Philippines", pop: 109.6, gdp: 361.5, mil: 55, tour: 65, hap: 5.7, luck: 58 },
  { code: "pl", name: "Poland", pop: 37.9, gdp: 594.2, mil: 65, tour: 68, hap: 6.1, luck: 58 },
  { code: "pt", name: "Portugal", pop: 10.3, gdp: 228.5, mil: 52, tour: 90, hap: 6.0, luck: 74, isWorldCup: true, isStrongFootball: true },
  { code: "qa", name: "Qatar", pop: 2.9, gdp: 146.4, mil: 55, tour: 70, hap: 6.4, luck: 60, isWorldCup: true },
  { code: "ro", name: "Romania", pop: 19.3, gdp: 248.7, mil: 52, tour: 50, hap: 6.1, luck: 52 },
  { code: "ru", name: "Russia", pop: 144.1, gdp: 1483.0, mil: 90, tour: 55, hap: 5.5, luck: 50 },
  { code: "rw", name: "Rwanda", pop: 13.0, gdp: 10.3, mil: 35, tour: 52, hap: 4.0, luck: 54 },
  { code: "kn", name: "Saint Kitts & Nevis", pop: 0.05, gdp: 0.9, mil: 5, tour: 72, hap: 6.0, luck: 55 },
  { code: "lc", name: "Saint Lucia", pop: 0.2, gdp: 1.6, mil: 5, tour: 78, hap: 6.0, luck: 55 },
  { code: "vc", name: "Saint Vincent", pop: 0.1, gdp: 0.8, mil: 5, tour: 70, hap: 6.0, luck: 55 },
  { code: "ws", name: "Samoa", pop: 0.2, gdp: 0.8, mil: 5, tour: 60, hap: 6.0, luck: 55 },
  { code: "sm", name: "San Marino", pop: 0.03, gdp: 1.5, mil: 5, tour: 75, hap: 6.5, luck: 55 },
  { code: "st", name: "Sao Tome & Principe", pop: 0.2, gdp: 0.4, mil: 5, tour: 40, hap: 5.5, luck: 50 },
  { code: "sa", name: "Saudi Arabia", pop: 34.8, gdp: 700.1, mil: 82, tour: 60, hap: 6.5, luck: 60, isWorldCup: true },
  { code: "sn", name: "Senegal", pop: 16.7, gdp: 24.9, mil: 38, tour: 45, hap: 5.1, luck: 60, isWorldCup: true },
  { code: "rs", name: "Serbia", pop: 6.9, gdp: 53.0, mil: 48, tour: 48, hap: 5.9, luck: 58 },
  { code: "sc", name: "Seychelles", pop: 0.1, gdp: 1.1, mil: 10, tour: 88, hap: 6.0, luck: 60 },
  { code: "sl", name: "Sierra Leone", pop: 8.0, gdp: 3.9, mil: 20, tour: 18, hap: 4.4, luck: 45 },
  { code: "sg", name: "Singapore", pop: 5.7, gdp: 340.0, mil: 65, tour: 84, hap: 6.4, luck: 60 },
  { code: "sk", name: "Slovakia", pop: 5.5, gdp: 104.6, mil: 40, tour: 52, hap: 6.3, luck: 54 },
  { code: "si", name: "Slovenia", pop: 2.1, gdp: 52.8, mil: 35, tour: 68, hap: 6.6, luck: 56 },
  { code: "sb", name: "Solomon Islands", pop: 0.7, gdp: 1.5, mil: 5, tour: 35, hap: 5.2, luck: 50 },
  { code: "so", name: "Somalia", pop: 15.9, gdp: 4.9, mil: 25, tour: 5, hap: 4.6, luck: 38 },
  { code: "za", name: "South Africa", pop: 59.3, gdp: 301.9, mil: 55, tour: 74, hap: 4.8, luck: 58, isWorldCup: true },
  { code: "ss", name: "South Sudan", pop: 11.2, gdp: 4.0, mil: 30, tour: 5, hap: 3.0, luck: 35 },
  { code: "es", name: "Spain", pop: 47.4, gdp: 1281.0, mil: 70, tour: 96, hap: 6.5, luck: 78, isWorldCup: true, isStrongFootball: true },
  { code: "lk", name: "Sri Lanka", pop: 21.9, gdp: 80.7, mil: 42, tour: 68, hap: 4.3, luck: 52 },
  { code: "sd", name: "Sudan", pop: 43.8, gdp: 26.1, mil: 45, tour: 8, hap: 4.1, luck: 42 },
  { code: "sr", name: "Suriname", pop: 0.6, gdp: 3.8, mil: 12, tour: 38, hap: 6.0, luck: 52 },
  { code: "se", name: "Sweden", pop: 10.4, gdp: 538.0, mil: 62, tour: 70, hap: 7.4, luck: 60, isWorldCup: true },
  { code: "ch", name: "Switzerland", pop: 8.6, gdp: 748.0, mil: 60, tour: 78, hap: 7.5, luck: 62, isWorldCup: true },
  { code: "sy", name: "Syria", pop: 17.5, gdp: 20.0, mil: 50, tour: 10, hap: 3.5, luck: 38 },
  { code: "tj", name: "Tajikistan", pop: 9.5, gdp: 8.0, mil: 28, tour: 22, hap: 5.3, luck: 48 },
  { code: "tz", name: "Tanzania", pop: 59.7, gdp: 62.4, mil: 35, tour: 58, hap: 4.8, luck: 52 },
  { code: "th", name: "Thailand", pop: 69.8, gdp: 501.8, mil: 52, tour: 88, hap: 5.9, luck: 56 },
  { code: "tl", name: "Timor-Leste", pop: 1.3, gdp: 1.6, mil: 10, tour: 25, hap: 4.8, luck: 48 },
  { code: "tg", name: "Togo", pop: 8.3, gdp: 7.5, mil: 25, tour: 18, hap: 4.1, luck: 46 },
  { code: "to", name: "Tonga", pop: 0.1, gdp: 0.5, mil: 5, tour: 48, hap: 6.0, luck: 52 },
  { code: "tt", name: "Trinidad & Tobago", pop: 1.4, gdp: 21.5, mil: 18, tour: 62, hap: 6.2, luck: 56 },
  { code: "tn", name: "Tunisia", pop: 11.8, gdp: 39.2, mil: 38, tour: 62, hap: 4.7, luck: 52, isWorldCup: true },
  { code: "tr", name: "Turkey", pop: 84.3, gdp: 720.0, mil: 78, tour: 85, hap: 4.9, luck: 58, isWorldCup: true },
  { code: "tm", name: "Turkmenistan", pop: 6.0, gdp: 45.5, mil: 35, tour: 15, hap: 5.5, luck: 48 },
  { code: "tv", name: "Tuvalu", pop: 0.01, gdp: 0.05, mil: 1, tour: 15, hap: 6.0, luck: 55 },
  { code: "ug", name: "Uganda", pop: 45.7, gdp: 37.3, mil: 35, tour: 38, hap: 4.6, luck: 50 },
  { code: "ua", name: "Ukraine", pop: 44.1, gdp: 155.6, mil: 72, tour: 40, hap: 4.9, luck: 50 },
  { code: "ae", name: "UAE", pop: 9.9, gdp: 358.8, mil: 65, tour: 82, hap: 6.6, luck: 60 },
  { code: "us", name: "United States", pop: 331.9, gdp: 21430.0, mil: 95, tour: 85, hap: 6.9, luck: 62, isWorldCup: true },
  { code: "uy", name: "Uruguay", pop: 3.5, gdp: 53.6, mil: 32, tour: 58, hap: 6.4, luck: 68, isWorldCup: true },
  { code: "uz", name: "Uzbekistan", pop: 34.2, gdp: 57.7, mil: 48, tour: 30, hap: 6.1, luck: 52, isWorldCup: true },
  { code: "vu", name: "Vanuatu", pop: 0.3, gdp: 0.9, mil: 5, tour: 68, hap: 6.0, luck: 55 },
  { code: "ve", name: "Venezuela", pop: 28.4, gdp: 48.6, mil: 45, tour: 30, hap: 4.9, luck: 45 },
  { code: "vn", name: "Vietnam", pop: 97.3, gdp: 271.2, mil: 68, tour: 62, hap: 5.4, luck: 54 },
  { code: "ye", name: "Yemen", pop: 29.8, gdp: 18.8, mil: 42, tour: 5, hap: 3.5, luck: 35 },
  { code: "zm", name: "Zambia", pop: 18.4, gdp: 19.3, mil: 25, tour: 40, hap: 4.8, luck: 48 },
  { code: "zw", name: "Zimbabwe", pop: 14.9, gdp: 16.7, mil: 30, tour: 48, hap: 4.9, luck: 48 },

  // Football Special subdivisions (UK) for presets
  { code: "gb-eng", name: "England", pop: 56.3, gdp: 2200.0, mil: 80, tour: 90, hap: 6.8, luck: 75, isWorldCup: true, isStrongFootball: true },
  { code: "gb-sct", name: "Scotland", pop: 5.5, gdp: 205.0, mil: 50, tour: 78, hap: 6.8, luck: 60, isWorldCup: true },
  { code: "gb-wls", name: "Wales", pop: 3.1, gdp: 90.0, mil: 40, tour: 72, hap: 6.8, luck: 58 }
];

// Complete list of 193 UN countries. We ensure that standard UN member states not covered explicitly above are filled dynamically or listed
const ALL_UN_MEMBER_STATES = [
  { code: "ad", name: "Andorra" }, { code: "ae", name: "United Arab Emirates" }, { code: "af", name: "Afghanistan" }, { code: "ag", name: "Antigua and Barbuda" },
  { code: "al", name: "Albania" }, { code: "am", name: "Armenia" }, { code: "ao", name: "Angola" }, { code: "ar", name: "Argentina" },
  { code: "at", name: "Austria" }, { code: "au", name: "Australia" }, { code: "az", name: "Azerbaijan" }, { code: "ba", name: "Bosnia and Herzegovina" },
  { code: "bb", name: "Barbados" }, { code: "bd", name: "Bangladesh" }, { code: "be", name: "Belgium" }, { code: "bf", name: "Burkina Faso" },
  { code: "bg", name: "Bulgaria" }, { code: "bh", name: "Bahrain" }, { code: "bi", name: "Burundi" }, { code: "bj", name: "Benin" },
  { code: "bn", name: "Brunei Darussalam" }, { code: "bo", name: "Bolivia" }, { code: "br", name: "Brazil" }, { code: "bs", name: "Bahamas" },
  { code: "bt", name: "Bhutan" }, { code: "bw", name: "Botswana" }, { code: "by", name: "Belarus" }, { code: "bz", name: "Belize" },
  { code: "ca", name: "Canada" }, { code: "cd", name: "Congo (Democratic Republic of the)" }, { code: "cf", name: "Central African Republic" }, { code: "cg", name: "Congo (Republic of the)" },
  { code: "ch", name: "Switzerland" }, { code: "ci", name: "Côte d'Ivoire" }, { code: "cl", name: "Chile" }, { code: "cm", name: "Cameroon" },
  { code: "cn", name: "China" }, { code: "co", name: "Colombia" }, { code: "cr", name: "Costa Rica" }, { code: "cu", name: "Cuba" },
  { code: "cv", name: "Cabo Verde" }, { code: "cy", name: "Cyprus" }, { code: "cz", name: "Czechia" }, { code: "de", name: "Germany" },
  { code: "dj", name: "Djibouti" }, { code: "dk", name: "Denmark" }, { code: "dm", name: "Dominica" }, { code: "do", name: "Dominican Republic" },
  { code: "dz", name: "Algeria" }, { code: "ec", name: "Ecuador" }, { code: "ee", name: "Estonia" }, { code: "eg", name: "Egypt" },
  { code: "er", name: "Eritrea" }, { code: "es", name: "Spain" }, { code: "et", name: "Ethiopia" }, { code: "fi", name: "Finland" },
  { code: "fj", name: "Fiji" }, { code: "fm", name: "Micronesia (Federated States of)" }, { code: "fr", name: "France" }, { code: "ga", name: "Gabon" },
  { code: "gb", name: "United Kingdom" }, { code: "gd", name: "Grenada" }, { code: "ge", name: "Georgia" }, { code: "gh", name: "Ghana" },
  { code: "gl", name: "Greenland" }, { code: "gm", name: "Gambia" }, { code: "gn", name: "Guinea" }, { code: "gq", name: "Equatorial Guinea" },
  { code: "gr", name: "Greece" }, { code: "gt", name: "Guatemala" }, { code: "gw", name: "Guinea-Bissau" }, { code: "gy", name: "Guyana" },
  { code: "hn", name: "Honduras" }, { code: "hr", name: "Croatia" }, { code: "ht", name: "Haiti" }, { code: "hu", name: "Hungary" },
  { code: "id", name: "Indonesia" }, { code: "ie", name: "Ireland" }, { code: "il", name: "Israel" }, { code: "in", name: "India" },
  { code: "iq", name: "Iraq" }, { code: "ir", name: "Iran (Islamic Republic of)" }, { code: "is", name: "Iceland" }, { code: "it", name: "Italy" },
  { code: "jm", name: "Jamaica" }, { code: "jo", name: "Jordan" }, { code: "jp", name: "Japan" }, { code: "ke", name: "Kenya" },
  { code: "kg", name: "Kyrgyzstan" }, { code: "kh", name: "Cambodia" }, { code: "ki", name: "Kiribati" }, { code: "km", name: "Comoros" },
  { code: "kn", name: "Saint Kitts and Nevis" }, { code: "kp", name: "Korea (Democratic People's Republic of)" }, { code: "kr", name: "Korea (Republic of)" }, { code: "kw", name: "Kuwait" },
  { code: "kz", name: "Kazakhstan" }, { code: "la", name: "Lao People's Democratic Republic" }, { code: "lb", name: "Lebanon" }, { code: "lc", name: "Saint Lucia" },
  { code: "li", name: "Liechtenstein" }, { code: "lk", name: "Sri Lanka" }, { code: "lr", name: "Liberia" }, { code: "ls", name: "Lesotho" },
  { code: "lt", name: "Lithuania" }, { code: "lu", name: "Luxembourg" }, { code: "lv", name: "Latvia" }, { code: "ly", name: "Libya" },
  { code: "ma", name: "Morocco" }, { code: "mc", name: "Monaco" }, { code: "md", name: "Moldova (Republic of)" }, { code: "me", name: "Montenegro" },
  { code: "mg", name: "Madagascar" }, { code: "mh", name: "Marshall Islands" }, { code: "mk", name: "North Macedonia" }, { code: "ml", name: "Mali" },
  { code: "mm", name: "Myanmar" }, { code: "mn", name: "Mongolia" }, { code: "mr", name: "Mauritania" }, { code: "mt", name: "Malta" },
  { code: "mu", name: "Mauritius" }, { code: "mv", name: "Maldives" }, { code: "mw", name: "Malawi" }, { code: "mx", name: "Mexico" },
  { code: "my", name: "Malaysia" }, { code: "mz", name: "Mozambique" }, { code: "na", name: "Namibia" }, { code: "ne", name: "Niger" },
  { code: "ng", name: "Nigeria" }, { code: "ni", name: "Nicaragua" }, { code: "nl", name: "Netherlands" }, { code: "no", name: "Norway" },
  { code: "np", name: "Nepal" }, { code: "nr", name: "Nauru" }, { code: "nz", name: "New Zealand" }, { code: "om", name: "Oman" },
  { code: "pa", name: "Panama" }, { code: "pe", name: "Peru" }, { code: "pg", name: "Papua New Guinea" }, { code: "ph", name: "Philippines" },
  { code: "pk", name: "Pakistan" }, { code: "pl", name: "Poland" }, { code: "pr", name: "Puerto Rico" }, { code: "pt", name: "Portugal" },
  { code: "pw", name: "Palau" }, { code: "py", name: "Paraguay" }, { code: "qa", name: "Qatar" }, { code: "ro", name: "Romania" },
  { code: "rs", name: "Serbia" }, { code: "ru", name: "Russian Federation" }, { code: "rw", name: "Rwanda" }, { code: "sa", name: "Saudi Arabia" },
  { code: "sb", name: "Solomon Islands" }, { code: "sc", name: "Seychelles" }, { code: "sd", name: "Sudan" }, { code: "se", name: "Sweden" },
  { code: "sg", name: "Singapore" }, { code: "si", name: "Slovenia" }, { code: "sk", name: "Slovakia" }, { code: "sl", name: "Sierra Leone" },
  { code: "sm", name: "San Marino" }, { code: "sn", name: "Senegal" }, { code: "so", name: "Somalia" }, { code: "sr", name: "Suriname" },
  { code: "ss", name: "South Sudan" }, { code: "st", name: "Sao Tome and Principe" }, { code: "sv", name: "El Salvador" }, { code: "sy", name: "Syrian Arab Republic" },
  { code: "sz", name: "Eswatini" }, { code: "td", name: "Chad" }, { code: "tg", name: "Togo" }, { code: "th", name: "Thailand" },
  { code: "tj", name: "Tajikistan" }, { code: "tl", name: "Timor-Leste" }, { code: "tm", name: "Turkmenistan" }, { code: "tn", name: "Tunisia" },
  { code: "to", name: "Tonga" }, { code: "tr", name: "Türkiye" }, { code: "tt", name: "Trinidad and Tobago" }, { code: "tv", name: "Tuvalu" },
  { code: "tz", name: "Tanzania (United Republic of)" }, { code: "ua", name: "Ukraine" }, { code: "ug", name: "Uganda" }, { code: "us", name: "United States of America" },
  { code: "uy", name: "Uruguay" }, { code: "uz", name: "Uzbekistan" }, { code: "vc", name: "Saint Vincent and the Grenadines" }, { code: "ve", name: "Venezuela (Bolivarian Republic of)" },
  { code: "vn", name: "Viet Nam" }, { code: "vu", name: "Vanuatu" }, { code: "ws", name: "Samoa" }, { code: "ye", name: "Yemen" },
  { code: "za", name: "South Africa" }, { code: "zm", name: "Zambia" }, { code: "zw", name: "Zimbabwe" }
];

// Helper to fill in stats for missing countries so we don't have to write stats for all 193 manually,
// while keeping them fully realistic based on standard random ranges if not explicitly detailed in COUNTRIES_DATA.
const getCountryDatabase = () => {
  const db = [];

  // Create lookup for detailed data
  const detailsMap = {};
  COUNTRIES_DATA.forEach(c => {
    detailsMap[c.code] = c;
  });

  ALL_UN_MEMBER_STATES.forEach(un => {
    let detail = detailsMap[un.code];
    if (!detail) {
      // Generate default semi-random balanced stats based on alphabetical hashing (for reproducibility)
      let hash = 0;
      for (let i = 0; i < un.name.length; i++) {
        hash = un.name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const getStat = (min, max, offset) => {
        const val = Math.abs((hash + offset) % 100) / 100;
        return min + val * (max - min);
      };

      detail = {
        code: un.code,
        name: un.name,
        pop: getStat(1, 150, 1),
        gdp: getStat(10, 500, 2),
        mil: Math.round(getStat(10, 80, 3)),
        tour: Math.round(getStat(10, 80, 4)),
        hap: getStat(3.5, 7.2, 5),
        luck: Math.round(getStat(30, 85, 6))
      };
    }

    db.push(detail);
  });

  // Also append any COUNTRIES_DATA entries not already in the UN list (e.g. Curaçao, England, Scotland, Wales)
  COUNTRIES_DATA.forEach(c => {
    if (!db.find(x => x.code === c.code)) {
      db.push(c);
    }
  });

  // Calculate normalized attributes for each country
  return db.map(c => {
    // Speed: influenced by Tourism (40%) + GDP (30%) + Luck (30%)
    const rawSpeed = (c.tour / 100) * 0.4 + (Math.min(c.gdp, 3000) / 3000) * 0.3 + (c.luck / 100) * 0.3;
    // Acceleration: Happiness (50%) + Luck (50%)
    const rawAcc = ((c.hap - 2.5) / 5.5) * 0.5 + (c.luck / 100) * 0.5;
    // Collision Power (Mass/Impact): Population (50%) + Military Strength (50%)
    const rawColl = (Math.min(c.pop, 500) / 500) * 0.5 + (c.mil / 100) * 0.5;
    // Recovery (bouncing/recovering momentum): GDP (50%) + Happiness (50%)
    const rawRec = (Math.min(c.gdp, 2000) / 2000) * 0.5 + ((c.hap - 2.5) / 5.5) * 0.5;
    // Consistency (performance stability): GDP (60%) + Military (40%)
    const rawCons = (Math.min(c.gdp, 5000) / 5000) * 0.6 + (c.mil / 100) * 0.4;

    // Convert raw stats into 0.0 to 1.0 ratings, clamping and mapping to standard physics parameters
    return {
      code: c.code,
      name: c.name,
      stats: {
        pop: c.pop,
        gdp: c.gdp,
        mil: c.mil,
        tour: c.tour,
        hap: c.hap,
        luck: c.luck
      },
      attributes: {
        // base values for physics
        speed: 0.5 + rawSpeed * 0.5,             // 0.5 to 1.0
        acceleration: 0.3 + rawAcc * 0.45,        // 0.3 to 0.75
        collisionPower: 0.3 + rawColl * 0.7,      // 0.3 to 1.0
        recovery: 0.4 + rawRec * 0.6,            // 0.4 to 1.0
        consistency: 0.5 + rawCons * 0.5         // 0.5 to 1.0
      },
      isWorldCup: !!c.isWorldCup,
      isStrongFootball: !!c.isStrongFootball
    };
  });
};

// Preset list of 48 nations in FIFA World Cup
const getWorldCup48Preset = (db) => {
  // Deprecated: keep for backward compatibility with older UI
  // World Cup 2026 mode should use getWorldCup2026Preset.

  // Back-compat: the original preset.
  // Return all countries that are flagged as isWorldCup.
  let list = db.filter(c => c.isWorldCup);

  if (list.length < 48) {
    const remaining = db.filter(c => !c.isWorldCup).sort((a, b) => b.stats.tour - a.stats.tour);
    while (list.length < 48 && remaining.length > 0) {
      list.push(remaining.shift());
    }
  }

  // Limit to exactly 48 for standard FIFA layout
  return list.slice(0, 48);
};

// World Cup 2026 preset: exact 48-team list (by dataset ISO-like codes).
// This hard-codes the official team set for World Cup 2026.
const WORLD_CUP_2026_TEAM_CODES = [
  // UEFA (Europe)
  'at', // Austria
  'be', // Belgium
  'ba', // Bosnia and Herzegovina
  'hr', // Croatia
  'cz', // Czechia
  'gb-eng', // England (UK subdivision)
  'fr', // France
  'de', // Germany
  'nl', // Netherlands
  'no', // Norway
  'pt', // Portugal
  'gb-sct', // Scotland (UK subdivision)
  'es', // Spain
  'se', // Sweden
  'ch', // Switzerland
  'tr', // Türkiye

  // CONMEBOL (South America)
  'ar', // Argentina
  'br', // Brazil
  'co', // Colombia
  'ec', // Ecuador
  'py', // Paraguay
  'uy', // Uruguay

  // CAF (Africa)
  'dz', // Algeria
  'cv', // Cabo Verde
  'cd', // DR Congo
  'ci', // Cote d'Ivoire
  'eg', // Egypt
  'gh', // Ghana
  'ma', // Morocco
  'sn', // Senegal
  'za', // South Africa
  'tn', // Tunisia

  // AFC (Asia)
  'au', // Australia (OFC in real, but dataset uses isWorldCup)
  'ir', // Iran
  'iq', // Iraq
  'jp', // Japan
  'jo', // Jordan
  'qa', // Qatar
  'sa', // Saudi Arabia
  'kr', // South Korea
  'uz', // Uzbekistan

  // CONCACAF (North, Central America, Caribbean)
  'ca', // Canada
  'cw', // Curaçao
  'ht', // Haiti
  'mx', // Mexico
  'pa', // Panama
  'us', // United States

  // OFC (Oceania)
  'nz' // New Zealand
];

const getWorldCup2026Preset = (db) => {
  // Filter by the explicit codes above.
  // If the dataset misses any code, we’ll fall back to existing WorldCup-flagged teams to reach 48.
  const byCode = new Map(db.map(c => [c.code, c]));
  const list = [];

  for (const code of WORLD_CUP_2026_TEAM_CODES) {
    const c = byCode.get(code);
    if (c) list.push(c);
    if (list.length === 48) break;
  }

  if (list.length < 48) {
    const remaining = db.filter(c => c.isWorldCup && !list.includes(c));
    while (list.length < 48 && remaining.length > 0) {
      // Prefer higher tourism teams.
      remaining.sort((a, b) => b.stats.tour - a.stats.tour);
      list.push(remaining.shift());
    }
  }

  return list.slice(0, 48);
};

