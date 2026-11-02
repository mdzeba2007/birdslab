/**
 * ============================================================================
 * PUBLICATIONS.JS - BIRDLab (IIT Jodhpur)
 * Google Scholar & Academic Synchronization Component & Service
 * Synchronized with Dr. Bhivraj Suthar (Google Scholar ID: 3KZSSEIAAAAJ)
 * ============================================================================
 */

(function () {
  'use strict';

  // GSAP Plugin registration
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const DEFAULT_SCHOLAR_ID = '3KZSSEIAAAAJ';
  const DEFAULT_SCHOLAR_PROFILE_URL = 'https://scholar.google.com/citations?user=3KZSSEIAAAAJ&hl=en';
  
  // Real-time Academic API (OpenAlex Open-Access endpoint for Dr. Bhivraj Suthar)
  const OPENALEX_AUTHOR_ID = 'A5044560238';
  const OPENALEX_AUTHOR_API = `https://api.openalex.org/authors/${OPENALEX_AUTHOR_ID}`;
  const OPENALEX_WORKS_API = `https://api.openalex.org/works?filter=author.id:${OPENALEX_AUTHOR_ID}&sort=publication_year:desc,cited_by_count:desc&per_page=100`;

  // Google Apps Script API connected to Google Sheet (for Admin panel additions)
  const PUBLICATIONS_API =
    'https://script.google.com/macros/s/AKfycbyk-yEUhBu5-Drnu3fqsEk4HF7dYP64VF_xkDLg9HLofk8ANBE7FMhk95Wk5hqXMLFp/exec';

  const SHEET_ID = '1TtI9ameanz3d5bQUIVZ24d3C9aBykpKT4KtgrefsSDc';

  /**
   * Helper: Read a field from a Google Sheet row object flexibly.
   */
  function getField(item, names, defaultValue = '') {
    if (!item || typeof item !== 'object') return defaultValue;
    const keys = Object.keys(item);
    for (const name of names) {
      const target = name.trim().toLowerCase().replace(/[\s_-]+/g, '');
      const foundKey = keys.find(k => k.trim().toLowerCase().replace(/[\s_-]+/g, '') === target);
      if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) {
        const val = String(item[foundKey]).trim();
        if (val !== '') return val;
      }
    }
    return defaultValue;
  }

  function isItemActive(item) {
    const status = getField(item, ['Status', 'status', 'State', 'state', 'Visibility', 'visibility', 'Active', 'active']).toLowerCase();
    if (!status) return true;
    return !['inactive', 'draft', 'hidden', 'deleted', 'archived', 'false', '0', 'no'].includes(status);
  }

  function extractRowsFromResponse(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
      if (Array.isArray(data.publications)) return data.publications;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.records)) return data.records;
      if (Array.isArray(data.rows)) return data.rows;
      if (Array.isArray(data.values)) return data.values;
      if (Array.isArray(data.result)) return data.result;
      if (Array.isArray(data.content)) return data.content;
      if (data.table && Array.isArray(data.table.rows)) {
        const cols = (data.table.cols || []).map(c => c.label || c.id || '');
        return data.table.rows.map(r => {
          const obj = {};
          if (r && Array.isArray(r.c)) {
            r.c.forEach((cell, idx) => {
              const colName = cols[idx] || `col_${idx}`;
              obj[colName] = cell ? (cell.f || cell.v || '') : '';
            });
          }
          return obj;
        });
      }
    }
    return [];
  }

  function parseRowToPublication(item, idx) {
    if (!item) return null;
    if (typeof item === 'object') {
      if (!isItemActive(item)) return null;
      const title = getField(item, ['Title', 'title', 'Paper Title', 'PaperTitle', 'Publication Title', 'Name', 'Heading']);
      if (!title || title.toLowerCase() === 'title' || title.toLowerCase() === 'paper title') return null;

      const authors = getField(item, ['Authors', 'authors', 'Author', 'author', 'By'], 'Dr. Bhivraj Suthar');
      const journal = getField(item, ['Journal', 'journal', 'Venue', 'venue', 'Conference', 'conference', 'Publisher'], '');
      const yearVal = getField(item, ['Year', 'year', 'Date', 'date', 'PubYear'], '');
      const yearMatch = String(yearVal).match(/\b(19\d{2}|20\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : (parseInt(yearVal, 10) || new Date().getFullYear());
      const type = getField(item, ['Type', 'type', 'Category', 'category'], 'Journal');
      const citations = parseInt(getField(item, ['Citations', 'citations', 'Cited by', 'CitedBy'], '0'), 10) || 0;
      const abstract = getField(item, ['Abstract', 'abstract', 'Description', 'description', 'Summary'], '');
      const doiUrl = getField(item, ['DOI', 'doi', 'Doi', 'Link', 'link', 'URL', 'url', 'Paper Link', 'PDF'], '');

      return {
        id: item.id || `sheet-${idx + 1}-${Date.now()}`,
        title: title,
        authors: authors,
        journal: journal,
        year: year,
        type: type,
        citations: citations,
        abstract: abstract,
        doiUrl: doiUrl,
        fromSheet: true
      };
    }
    return null;
  }

  /**
   * Helper: Normalize DOI and ensure it resolves to a direct, valid HTTPS URL.
   */
  function normalizeDoiUrl(pub) {
    let url = (pub.doiUrl || pub.doi || pub.url || '').trim();
    if (url) {
      if (/^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(url)) {
        return 'https://doi.org/' + url;
      }
      if (url.toLowerCase().startsWith('doi.org/')) {
        return 'https://' + url;
      }
      if (/^https?:\/\//i.test(url)) {
        return url;
      }
      return 'https://doi.org/' + url;
    }
    if (pub.scholarUrl) {
      return pub.scholarUrl;
    }
    if (pub.title) {
      return `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}`;
    }
    return DEFAULT_SCHOLAR_PROFILE_URL;
  }

  /**
   * AUTHORITATIVE live Google Scholar metrics for Dr. Bhivraj Suthar
   * Source: https://scholar.google.com/citations?user=3KZSSEIAAAAJ
   */
  const SCHOLAR_PROFILE = {
    citations: 664,
    hIndex: 14,
    i10Index: 22,
    papers: 78
  };

  const DEFAULT_PUBLICATIONS = [
    {
      id: 1,
      title: "Advancements in precision spraying of agricultural robots: A comprehensive review",
      authors: "K Lochan, A Khan, I Elsayed, B Suthar, L Seneviratne, I Hussain",
      journal: "IEEE Access 12, 129447-129483, 2024",
      year: 2024,
      type: "review",
      citations: 119,
      abstract: "This paper provides an exhaustive review of state-of-the-art agricultural robotics focusing on precision spraying mechanisms, vision-based target detection, droplet distribution dynamics, and bio-inspired actuator architectures.",
      doiUrl: "https://doi.org/10.1109/access.2024.3450904",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:vV6vV6tmYwMC"
    },
    {
      id: 2,
      title: "MGlove-TS: A modular soft glove based on twisted string actuators and flexible structures",
      authors: "M Dragusanu, D Troisi, B Suthar, I Hussain, D Prattichizzo, M Malvezzi",
      journal: "Mechatronics 98, 103141, 2024",
      year: 2024,
      type: "journal",
      citations: 41,
      abstract: "Presents a novel modular wearable assistive glove powered by twisted string actuators (TSAs) embedded in a soft flexible exoskeletal frame for stroke rehabilitation and delicate grasping assistance.",
      doiUrl: "https://doi.org/10.1016/j.mechatronics.2024.103141",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:O3NaXMp0MMsC"
    },
    {
      id: 3,
      title: "Design and Feasibility Analysis of a Foldable Robot Arm for Drones Using a Twisted String Actuator: FRAD-TSA",
      authors: "BSS Jung",
      journal: "IEEE Robotics and Automation Letters, 2021",
      year: 2021,
      type: "journal",
      citations: 38,
      abstract: "Proposes an ultra-lightweight deployable robotic manipulator mounted on an unmanned aerial vehicle (UAV), utilizing TSA transmission to realize high payload-to-weight aerial grasping capabilities.",
      doiUrl: "https://doi.org/10.1109/lra.2021.3084890",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:hC7cP41nSMkC"
    },
    {
      id: 4,
      title: "A study on life cycle of twisted string actuators: Preliminary results",
      authors: "M Usman, H Seong, B Suthar, I Gaponov, JH Ryu",
      journal: "2017 IEEE/RSJ International Conference on Intelligent Robots and Systems …, 2017",
      year: 2017,
      type: "conference",
      citations: 34,
      abstract: "Research study on a study on life cycle of twisted string actuators: preliminary results by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/iros.2017.8206339",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:ULOm3_A8WrAC"
    },
    {
      id: 5,
      title: "Preliminary study of twisted string actuation through a conduit toward soft and wearable actuation",
      authors: "B Suthar, M Usman, H Seong, I Gaponov, JH Ryu",
      journal: "2018 IEEE International Conference on Robotics and Automation (ICRA), 2260-2265, 2018",
      year: 2018,
      type: "conference",
      citations: 33,
      abstract: "Research study on preliminary study of twisted string actuation through a conduit toward soft and wearable actuation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/icra.2018.8460589",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:4TOpqqG69KYC"
    },
    {
      id: 6,
      title: "Self-organizing BFBEL control system for a UAV under wind disturbance",
      authors: "PK Muthusamy, B Suthar, R Muthusamy, M Garratt, H Pota, L Seneviratne, ...",
      journal: "IEEE Transactions on Industrial Electronics 71 (5), 5021-5033, 2023",
      year: 2023,
      type: "journal",
      citations: 32,
      abstract: "Research study on self-organizing bfbel control system for a uav under wind disturbance by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/tie.2023.3285922",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:M3NEmzRMIkIC"
    },
    {
      id: 7,
      title: "Design and bending analysis of a metamorphic parallel twisted-scissor mechanism",
      authors: "B Suthar, S Jung",
      journal: "Journal of Mechanisms and Robotics 13 (4), 040901, 2021",
      year: 2021,
      type: "journal",
      citations: 31,
      abstract: "Research study on design and bending analysis of a metamorphic parallel twisted-scissor mechanism by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1115/1.4050813",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:ZeXyd9-uunAC"
    },
    {
      id: 8,
      title: "A novel grid and place neuron’s computational modeling to learn spatial semantics of an environment",
      authors: "R Shrivastava, P Kumar, S Tripathi, V Tiwari, DS Rajput, TR Gadekallu, ...",
      journal: "Applied Sciences 10 (15), 5147, 2020",
      year: 2020,
      type: "journal",
      citations: 18,
      abstract: "Research study on a novel grid and place neuron’s computational modeling to learn spatial semantics of an environment by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.3390/app10155147",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:QIV2ME_5wuYC"
    },
    {
      id: 9,
      title: "20 DOF robotic hand for tele-operation:—Design, simulation, control and accuracy test with leap motion",
      authors: "L Heisnam, B Suthar",
      journal: "IEEE Robotics and Automation for Humanitarian Applications (RAHA), 2016 …, 2016",
      year: 2016,
      type: "conference",
      citations: 18,
      abstract: "Research study on 20 dof robotic hand for tele-operation:—design, simulation, control and accuracy test with leap motion by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/raha.2016.7931886",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:Zph67rFs4hoC"
    },
    {
      id: 10,
      title: "Tele-operation of an industrial robot by an arm exoskeleton for peg-in-hole operation using immersive environments",
      authors: "S Kansal, M Zubair, B Suthar, S Mukherjee",
      journal: "Robotica 40 (2), 234-249, 2022",
      year: 2022,
      type: "journal",
      citations: 16,
      abstract: "Research study on tele-operation of an industrial robot by an arm exoskeleton for peg-in-hole operation using immersive environments by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1017/s0263574721000485",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:qUcmZB5y_30C"
    },
    {
      id: 11,
      title: "Single-motor-based bidirectional twisted string actuation with variable radius pulleys",
      authors: "MA Khan, B Suthar, I Gaponov, JH Ryu",
      journal: "IEEE Robotics and Automation Letters 4 (4), 3735-3741, 2019",
      year: 2019,
      type: "journal",
      citations: 16,
      abstract: "Research study on single-motor-based bidirectional twisted string actuation with variable radius pulleys by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/lra.2019.2928772",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:Wp0gIr-vW9MC"
    },
    {
      id: 12,
      title: "Ferro-fluid based portable fingertip haptic display and its preliminary experimental evaluation",
      authors: "H Singh, B Suthar, SZ Mehdi, JH Ryu",
      journal: "2018 IEEE Haptics Symposium (HAPTICS), 14-19, 2018",
      year: 2018,
      type: "conference",
      citations: 16,
      abstract: "Research study on ferro-fluid based portable fingertip haptic display and its preliminary experimental evaluation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/haptics.2018.8357146",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:_kc_bZDykSQC"
    },
    {
      id: 13,
      title: "Twisted string actuators: Comprehensive review on modeling, design innovations, application advances, and future challenges",
      authors: "M Malvezzi, B Suthar, M Dragusanu",
      journal: "Measurement, 118824, 2025",
      year: 2025,
      type: "review",
      citations: 15,
      abstract: "An authoritative review surveying the physics, mathematical modeling, thermal dynamics, friction hysteresis, and broad application landscape of twisted string actuation systems in wearable and bio-inspired robotics.",
      doiUrl: "https://doi.org/10.1016/j.measurement.2025.118824",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:ZHo1McVdvXMC"
    },
    {
      id: 14,
      title: "Exoskeleton for tele-operation of industrial robot",
      authors: "S Mukherjee, M Zubair, B Suthar, S Kansal",
      journal: "Proceedings of conference on advances in robotics, 1-5, 2013",
      year: 2013,
      type: "conference",
      citations: 14,
      abstract: "Presents a low-latency digital sensor bus architecture utilizing I2C bus arbitration across multi-joint exoskeleton sensors to eliminate cabling bottlenecks during teleoperation.",
      doiUrl: "https://doi.org/10.1145/2506095.2506108",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:u-x6o8ySG0sC"
    },
    {
      id: 15,
      title: "A 3 degrees-of-freedom lightweight flexible twisted string actuators (tsas)-based exoskeleton for wrist rehabilitation",
      authors: "M Dragusanu, N Guinet, B Suthar, TL Baldi, D Prattichizzo, M Malvezzi",
      journal: "IEEE Robotics and Automation Letters 10 (6), 6520-6527, 2025",
      year: 2025,
      type: "journal",
      citations: 13,
      abstract: "Research study on a 3 degrees-of-freedom lightweight flexible twisted string actuators (tsas)-based exoskeleton for wrist rehabilitation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/lra.2025.3568305",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:u_35RYKgDlwC"
    },
    {
      id: 16,
      title: "Robotic Fingers: Advancements, Challenges, and Future Directions–A Comprehensive Review",
      authors: "B Suthar, Y Abdulrahman, Y Zweiri",
      journal: "IEEE Access 12, 110113-110130, 2024",
      year: 2024,
      type: "review",
      citations: 13,
      abstract: "Comprehensive review analyzing robotic finger kinematic topologies, compliance modulation, underactuation strategies, and novel tendon-driven and twisted string actuator transmissions.",
      doiUrl: "https://doi.org/10.1109/access.2024.3440007",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:lSLTfruPkqcC"
    },
    {
      id: 17,
      title: "Design and experimental evaluation of a sensorized parallel gripper with optical mirroring mechanism",
      authors: "O Faris, H Alyammahi, B Suthar, R Muthusamy, UH Shah, I Hussain, ...",
      journal: "Mechatronics 90, 102955, 2023",
      year: 2023,
      type: "journal",
      citations: 12,
      abstract: "Research study on design and experimental evaluation of a sensorized parallel gripper with optical mirroring mechanism by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1016/j.mechatronics.2023.102955",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:r0BpntZqJG4C"
    },
    {
      id: 18,
      title: "Design of twisted string actuated flexure joint for supernumerary robotic arm for bimanual tasks",
      authors: "B Hasanen, B Suthar, Y Zweiri, L Seneviratne, I Hussain",
      journal: "IEEE Sensors Journal 25 (5), 7848-7857, 2024",
      year: 2024,
      type: "journal",
      citations: 11,
      abstract: "Research study on design of twisted string actuated flexure joint for supernumerary robotic arm for bimanual tasks by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.36227/techrxiv.24151503",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:J_g5lzvAfSwC"
    },
    {
      id: 19,
      title: "Passive returning mechanism for twisted string actuators",
      authors: "M Usman, B Suthar, H Seong, E Hawkes, I Gaponov, JH Ryu",
      journal: "2017 IEEE international conference on robotics and automation (ICRA), 3714-3719, 2017",
      year: 2017,
      type: "conference",
      citations: 11,
      abstract: "Research study on passive returning mechanism for twisted string actuators by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/icra.2017.7989428",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:YOwf2qJgpHMC"
    },
    {
      id: 20,
      title: "Aerial manipulation of long objects using adaptive neuro-fuzzy controller under battery variability",
      authors: "PK Muthusamy, MB Mohiuddin, A Peringal, B Suthar, R Muthusamy, ...",
      journal: "Scientific Reports 15 (1), 10941, 2025",
      year: 2025,
      type: "journal",
      citations: 10,
      abstract: "Research study on aerial manipulation of long objects using adaptive neuro-fuzzy controller under battery variability by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1038/s41598-025-94937-8",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:pqnbT2bcN3wC"
    },
    {
      id: 21,
      title: "Design of robotic finger using twisted string actuator with modular passive return rotational joints to achieve high grasping force: Application to wearable sixth finger",
      authors: "B Suthar, MI Awad, L Seneviratne, Y Zweiri, I Hussain",
      journal: "Mechatronics 99, 103157, 2024",
      year: 2024,
      type: "journal",
      citations: 10,
      abstract: "Research study on design of robotic finger using twisted string actuator with modular passive return rotational joints to achieve high grasping force: application to wearable sixth finger by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1016/j.mechatronics.2024.103157",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:RGFaLdJalmkC"
    },
    {
      id: 22,
      title: "Methods of ensuring information security in BIM",
      authors: "VK Maksudovna, GZ Anatolyevna, S Dixit, B Suthar, S Kampani, ...",
      journal: "E3S web of conferences 430, 01190, 2023",
      year: 2023,
      type: "conference",
      citations: 10,
      abstract: "Research study on methods of ensuring information security in bim by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1051/e3sconf/202343001190",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:GnPB-g6toBAC"
    },
    {
      id: 23,
      title: "Utilization of fuzzy logic (FL) and whale optimization algorithm (WOA) for optimization of load scheduling in energy management systems",
      authors: "B Suthar, A Punia, P Sharma, A Jain, R Narayan, YK Raju, N Sharma, ...",
      journal: "International Journal of Information Technology 17 (6), 3717-3722, 2025",
      year: 2025,
      type: "journal",
      citations: 9,
      abstract: "Research study on utilization of fuzzy logic (fl) and whale optimization algorithm (woa) for optimization of load scheduling in energy management systems by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1007/s41870-025-02571-4",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:HoB7MX3m0LUC"
    },
    {
      id: 24,
      title: "Development of a soft actuated glove based on twisted string actuators for hand rehabilitation",
      authors: "MM Mihai Dragusanu, Danilo Troisi, Bhivraj Suthar, Domenico Prattichizzo",
      journal: "10th IEEE RAS/EMBS International Conference on Biomedical Robotics and …, 2024",
      year: 2024,
      type: "conference",
      citations: 9,
      abstract: "Research study on development of a soft actuated glove based on twisted string actuators for hand rehabilitation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/biorob60516.2024.10719698",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:RYcK_YlVTxYC"
    },
    {
      id: 25,
      title: "Breast cancer diagnosis from histopathology images using deep learning methods: a survey",
      authors: "V Patel, V Chaurasia, R Mahadeva, A Ghosh, S Dixit, B Suthar, V Gupta, ...",
      journal: "E3S Web of Conferences 430, 01195, 2023",
      year: 2023,
      type: "conference",
      citations: 9,
      abstract: "Research study on breast cancer diagnosis from histopathology images using deep learning methods: a survey by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1051/e3sconf/202343001195",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:BqipwSGYUEgC"
    },
    {
      id: 26,
      title: "Design of a drone-hawk gripper for nest removal from electric tower",
      authors: "B Suthar, S Jung",
      journal: "2021 21st International Conference on Control, Automation and Systems (ICCAS …, 2021",
      year: 2021,
      type: "conference",
      citations: 8,
      abstract: "Research study on design of a drone-hawk gripper for nest removal from electric tower by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.23919/iccas52745.2021.9650012",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:e5wmG9Sq2KIC"
    },
    {
      id: 27,
      title: "Twisted string actuation through a conduit: Undesirable behaviors and pre-twist effects",
      authors: "JHR bhivraj suthar",
      journal: "Mechatronics 96 (2023/10/24), 1-11, 2023",
      year: 2023,
      type: "journal",
      citations: 7,
      abstract: "Research study on twisted string actuation through a conduit: undesirable behaviors and pre-twist effects by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1016/j.mechatronics.2023.103084",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:j3f4tGmQtD8C"
    },
    {
      id: 28,
      title: "Design and Experimental Evaluation of Foldable Robot Arms for a Holding and Installation Work: FRAHI",
      authors: "B Suthar, Y Choi, S Jung",
      journal: "2021 30th IEEE International Conference on Robot & Human Interactive …, 2021",
      year: 2021,
      type: "conference",
      citations: 7,
      abstract: "Research study on design and experimental evaluation of foldable robot arms for a holding and installation work: frahi by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/ro-man50785.2021.9515456",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:mB3voiENLucC"
    },
    {
      id: 29,
      title: "Vibration suppression mechanism for foldable robot arm for drones",
      authors: "M Zubair, YJ Choi, B Suthar, S Jung",
      journal: "2021 18th International conference on ubiquitous robots (UR), 119-123, 2021",
      year: 2021,
      type: "conference",
      citations: 7,
      abstract: "Research study on vibration suppression mechanism for foldable robot arm for drones by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/ur52253.2021.9494686",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:-f6ydRqryjwC"
    },
    {
      id: 30,
      title: "Artificial intelligence in water desalination: a novel approach for global sustainability",
      authors: "R Mahadeva, V Patel, A Ghosh, S Dixit, B Suthar, V Gupta, VK Awaar, ...",
      journal: "E3S web of conferences 430, 01193, 2023",
      year: 2023,
      type: "conference",
      citations: 6,
      abstract: "Research study on artificial intelligence in water desalination: a novel approach for global sustainability by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1051/e3sconf/202343001193",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:hMod-77fHWUC"
    },
    {
      id: 31,
      title: "Comparative study of noise and digital filters for image processing",
      authors: "S Sheikh, B Suthar, M Uddin",
      journal: "2017 International Conference on Innovations in Control, Communication and …, 2017",
      year: 2017,
      type: "conference",
      citations: 6,
      abstract: "Research study on comparative study of noise and digital filters for image processing by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/iciccis.2017.8660897",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:bEWYMUwI8FkC"
    },
    {
      id: 32,
      title: "Women empowerment by technology supported manufacturing of beads from Holy Basil",
      authors: "R Gupta, M Sharma, DP Singh, B Suthar, SK Saha",
      journal: "Current Science, 1660-1664, 2015",
      year: 2015,
      type: "journal",
      citations: 6,
      abstract: "Research study on women empowerment by technology supported manufacturing of beads from holy basil by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:WF5omc3nYNoC"
    },
    {
      id: 33,
      title: "Design of adaptive sensor coupling-based upper limb 7-DOF exoskeleton for smooth human motion tracking: ASC-EXO",
      authors: "B Suthar, M Zubair, S Kansal, S Mukherjee",
      journal: "IEEE Sensors Journal 23 (18), 20607-20618, 2023",
      year: 2023,
      type: "journal",
      citations: 5,
      abstract: "Research study on design of adaptive sensor coupling-based upper limb 7-dof exoskeleton for smooth human motion tracking: asc-exo by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/jsen.2023.3270172",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:maZDTaKrznsC"
    },
    {
      id: 34,
      title: "Conceptual design and feasibility test of foldable robotic arms for collaborative work: Frac",
      authors: "B Suthar, S Jung",
      journal: "2021 IEEE 17th International conference on automation science and …, 2021",
      year: 2021,
      type: "conference",
      citations: 5,
      abstract: "Research study on conceptual design and feasibility test of foldable robotic arms for collaborative work: frac by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/case49439.2021.9551518",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:HDshCWvjkbEC"
    },
    {
      id: 35,
      title: "Kinematic mapping of Exoskeleton with virtual KUKA robot",
      authors: "M Zubair, S Kansal, B Suthar, S Mukherjee",
      journal: "IEEE Robotics and Automation for Humanitarian Applications (RAHA), 2016 …, 2016",
      year: 2016,
      type: "conference",
      citations: 5,
      abstract: "Research study on kinematic mapping of exoskeleton with virtual kuka robot by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/raha.2016.7931869",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:KlAtU1dfN6UC"
    },
    {
      id: 36,
      title: "Self-folding gravity compensation mechanism for a supplementary folding robot arm: Design, analysis and implementation",
      authors: "B Suthar, M Zubair, S Jung",
      journal: "Robotics and Autonomous Systems 190, 104984, 2025",
      year: 2025,
      type: "journal",
      citations: 4,
      abstract: "Research study on self-folding gravity compensation mechanism for a supplementary folding robot arm: design, analysis and implementation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1016/j.robot.2025.104984",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:35N4QoGY0k4C"
    },
    {
      id: 37,
      title: "Jitter removal in KUKA KR-5 using Modified Kalman Filter while tele-operating with Exoskeleton",
      authors: "S Rawal, S Kansal, M Zubair, B Suthar, S Mukherjee",
      journal: "The Proceedings of the Asian Conference on Multibody Dynamics 2016.8, 34_1283854, 2016",
      year: 2016,
      type: "conference",
      citations: 4,
      abstract: "Research study on jitter removal in kuka kr-5 using modified kalman filter while tele-operating with exoskeleton by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1299/jsmeacmd.2016.8.34_1283854",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:_FxGoFyzp5QC"
    },
    {
      id: 38,
      title: "Design of a Novel Twisted-Scissor Structure for a foldable robot arm",
      authors: "B Suthar, S Jung",
      journal: "2021 18th International Conference on Ubiquitous Robots (UR), 139-143, 2021",
      year: 2021,
      type: "conference",
      citations: 3,
      abstract: "Research study on design of a novel twisted-scissor structure for a foldable robot arm by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/ur52253.2021.9494707",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:hFOr9nPyWt4C"
    },
    {
      id: 39,
      title: "Validation of end effector matrix for robotic kit owi-535 using Matlab and Robo analyzer",
      authors: "B Suthar, T Shrivastava, L Heisnam",
      journal: "International Journal of Robotics and Automation (IJRA) 5 (1), 54-60, 2016",
      year: 2016,
      type: "journal",
      citations: 3,
      abstract: "Research study on validation of end effector matrix for robotic kit owi-535 using matlab and robo analyzer by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.11591/ijra.v5i1.pp54-60",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:Tyk-4Ss8FVUC"
    },
    {
      id: 40,
      title: "Evolution of the Exoskeleton",
      authors: "S Kansal, B Suthar, M Zubair, S Mukherjee",
      journal: "Aug, 2016",
      year: 2016,
      type: "journal",
      citations: 3,
      abstract: "Research study on evolution of the exoskeleton by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.5281/zenodo.7360182",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:ufrVoPGSRksC"
    },
    {
      id: 41,
      title: "Removal of jittering in KUKA KR5 while tele-operation with exoskeleton",
      authors: "B Suthar, S Kansal, M Zubair, S Jaitly, S Mukherjee",
      journal: "Proceedings of the 2015 Conference on Advances In Robotics, 1-5, 2015",
      year: 2015,
      type: "conference",
      citations: 3,
      abstract: "Research study on removal of jittering in kuka kr5 while tele-operation with exoskeleton by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1145/2783449.2783496",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:IjCSPb-OGe4C"
    },
    {
      id: 42,
      title: "Haptics exoskeleton for tele-operation of industrial robot",
      authors: "M Zubair, B Suthar, S Kansal, S Mukherjee",
      journal: "Proceedings of the 3rd joint international conference on multibody dynamics …, 2014",
      year: 2014,
      type: "conference",
      citations: 3,
      abstract: "Research study on haptics exoskeleton for tele-operation of industrial robot by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1145/2506095.2506108",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:zYLM7Y9cAGgC"
    },
    {
      id: 43,
      title: "Closed loop autonomous calibration of tele-operation exoskeleton",
      authors: "S Mukherjee, M Zubair, B Suthar, S Kansal",
      journal: "Proceedings of Conference on Advances in Robotics, 1-3, 2013",
      year: 2013,
      type: "conference",
      citations: 3,
      abstract: "Formulates a closed-loop kinematic parameter identification method to compensate for individual anatomical variations when donning wearable master arm devices.",
      doiUrl: "https://doi.org/10.1145/2506095.2506109",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:qxL8FJ1GzNcC"
    },
    {
      id: 44,
      title: "Twisted String Actuation Module for Compact Robotic Finger With Extended Stroke, Reduced Hysteresis, and Bidirectional Operation",
      authors: "C Lee, B Suthar, S Jeong",
      journal: "IEEE Robotics and Automation Letters 11 (2), 1602-1609, 2025",
      year: 2025,
      type: "journal",
      citations: 2,
      abstract: "Research study on twisted string actuation module for compact robotic finger with extended stroke, reduced hysteresis, and bidirectional operation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/lra.2025.3644173",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:rO6llkc54NcC"
    },
    {
      id: 45,
      title: "Robotic drone arm for civil structures inspection: challenges and future directions",
      authors: "B Suthar, R Mahadeva, S Dixit, V Kumar, K Arun, R Arora, S Ahuja",
      journal: "E3S web of conferences 430, 01192, 2023",
      year: 2023,
      type: "conference",
      citations: 2,
      abstract: "Research study on robotic drone arm for civil structures inspection: challenges and future directions by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1051/e3sconf/202343001192",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:YFjsv_pBGBYC"
    },
    {
      id: 46,
      title: "Neurocognitive Mechanisms of Anti-Lingual & Accent Bias Stereotyping in Virtual Reality and the Sustainable Development of Linguistic Response",
      authors: "A Ghosh, A Kumar, U Kumar, R Mahadeva, V Gupta, B Suthar, V Patel, ...",
      journal: "E3S Web of Conferences 430, 01194, 2023",
      year: 2023,
      type: "conference",
      citations: 2,
      abstract: "Research study on neurocognitive mechanisms of anti-lingual & accent bias stereotyping in virtual reality and the sustainable development of linguistic response by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1051/e3sconf/202343001194",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:NMxIlDl6LWMC"
    },
    {
      id: 47,
      title: "Design and Analysis of Flexure Mechanisms for Human Hand Tremor Compensation",
      authors: "M Zubair, B Suthar, S Jung",
      journal: "IEEE Access, Early Access Article, 2022",
      year: 2022,
      type: "journal",
      citations: 2,
      abstract: "Research study on design and analysis of flexure mechanisms for human hand tremor compensation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/access.2022.3162903",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:RHpTSmoSYBkC"
    },
    {
      id: 48,
      title: "Design of energy efficient four finger robotic hand",
      authors: "B Suthar, N Sindhu",
      journal: "International Journal of Robotics and Automation (IJRA) 5 (1), 1-5, 2016",
      year: 2016,
      type: "journal",
      citations: 2,
      abstract: "Research study on design of energy efficient four finger robotic hand by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.11591/ijra.v5i1.pp1-5",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:9ZlFYXVOiuMC"
    },
    {
      id: 49,
      title: "Design of Twisted String Actuated Flexure Joint for Supernumerary Robotic Arm for Bi-manual Tasks",
      authors: "B Suthar",
      journal: "TechRxiv 2023 (0921), 2023",
      year: 2023,
      type: "journal",
      citations: 1,
      abstract: "Research study on design of twisted string actuated flexure joint for supernumerary robotic arm for bi-manual tasks by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.36227/techrxiv.24151503",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:blknAaTinKkC"
    },
    {
      id: 50,
      title: "Conceptual Design of an Extendable Rope-Inspired Module Space Orbit Arm for Maneuvering: ERM-SOA",
      authors: "B Suthar, S Jung",
      journal: "46th Aerospace Mechanisms Symposium, JSC, NASA, USA, 337-349, 2022",
      year: 2022,
      type: "conference",
      citations: 1,
      abstract: "Research study on conceptual design of an extendable rope-inspired module space orbit arm for maneuvering: erm-soa by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.5281/zenodo.7359833",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:4JMBOYKVnBMC"
    },
    {
      id: 51,
      title: "Design and development of a co-axial passive flexion mechanism-based gripper for irregular objects",
      authors: "B Suthar, S Jung",
      journal: "2021 21st International Conference on Control, Automation and Systems (ICCAS …, 2021",
      year: 2021,
      type: "conference",
      citations: 1,
      abstract: "Research study on design and development of a co-axial passive flexion mechanism-based gripper for irregular objects by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.23919/iccas52745.2021.9649775",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:R3hNpaxXUhUC"
    },
    {
      id: 52,
      title: "An Experimental Setup to Study the Performance of Flexure Mechanism",
      authors: "M Zubair, B Suthar, S Jung",
      journal: "2021 21st International Conference on Control, Automation and Systems (ICCAS …, 2021",
      year: 2021,
      type: "conference",
      citations: 1,
      abstract: "Research study on an experimental setup to study the performance of flexure mechanism by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.23919/iccas52745.2021.9649929",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:TQgYirikUcIC"
    },
    {
      id: 53,
      title: "A Bio-inspired Cat-Leap Parkour Rolling Mechanism (CPRM): Design Inception to Realization, and Applications",
      authors: "B Suthar, V Dave",
      journal: "IROS Workshop on Mechanisms and Design from Inception to Realization-2020, 2020",
      year: 2020,
      type: "conference",
      citations: 1,
      abstract: "Presents a multi-stage bio-inspired parkour locomotion mechanism mimicking feline leaping and kinetic-energy dissipating landing rolls for high-drop obstacle crossing.",
      doiUrl: "https://doi.org/10.36227/techrxiv.21657497",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:7PzlFSSx8tAC"
    },
    {
      id: 54,
      title: "Business Trends and Opportunities of South Korea and India Cooperation",
      authors: "OA Shvetsova, B Suthar",
      journal: "2018 IEEE International Conference\" Quality Management, Transport and …, 2018",
      year: 2018,
      type: "conference",
      citations: 1,
      abstract: "Research study on business trends and opportunities of south korea and india cooperation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/itmqis.2018.8525042",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:k_IJM867U9cC"
    },
    {
      id: 55,
      title: "Evolution of the exoskeleton-IIT Delhi",
      authors: "S Kansal, M Zubair, B Suthar, S Mukherjee",
      journal: "Proc. 3rd Joint Int. Conf. Multibody Dyn., 2016",
      year: 2016,
      type: "journal",
      citations: 1,
      abstract: "Research study on evolution of the exoskeleton-iit delhi by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.5281/zenodo.7360182",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:mVmsd5A6BfQC"
    },
    {
      id: 56,
      title: "Implementation of I2C Communication Protocol in Exoskeleton for tele-operation of Industrial Robot",
      authors: "B Suthar, Z Priyansh, S Kansal, M Zubair, S Jaitly, S Mukherjee",
      journal: "",
      year: 2024,
      type: "journal",
      citations: 1,
      abstract: "Presents a low-latency digital sensor bus architecture utilizing I2C bus arbitration across multi-joint exoskeleton sensors to eliminate cabling bottlenecks during teleoperation.",
      doiUrl: "https://doi.org/10.1145/2506095.2506108",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:YsMSGLbcyi4C"
    },
    {
      id: 57,
      title: "SwarmSAR-FW: Drone-Based Swarm Search and Rescue in Fire and Water Disasters",
      authors: "V Siotia, RS Shankar, R Reddy, R Mahadeva, B Suthar",
      journal: "IEEE Access, 2026",
      year: 2026,
      type: "journal",
      citations: 0,
      abstract: "Research study on swarmsar-fw: drone-based swarm search and rescue in fire and water disasters by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/access.2026.3730315",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:a0OBvERweLwC"
    },
    {
      id: 58,
      title: "Investigating sensorimotor beta burst dynamics as a robust biomarker for graded force modulation in humans",
      authors: "MS Perwez, JJ Bonaiuto, B Suthar, V Muralidharan",
      journal: "bioRxiv, 2026.05. 07.723396, 2026",
      year: 2026,
      type: "journal",
      citations: 0,
      abstract: "Research study on investigating sensorimotor beta burst dynamics as a robust biomarker for graded force modulation in humans by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.64898/2026.05.07.723396",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:fPk4N6BV_jEC"
    },
    {
      id: 59,
      title: "Compliant Robotic Biceps Machine for Resistance Training and Upper Limb Rehabilitation",
      authors: "MI Awad, NA Al-Rahmani, Z Nui, B Suthar, MF Domingues, I Hussain, ...",
      journal: "IEEE Access 13, 174034-174043, 2025",
      year: 2025,
      type: "journal",
      citations: 0,
      abstract: "Research study on compliant robotic biceps machine for resistance training and upper limb rehabilitation by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1109/access.2025.3617790",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:3s1wT3WcHBgC"
    },
    {
      id: 60,
      title: "Hand Function Recovery in Chronic Stroke Patients using Dynamic Constraints based ExoRehabGlove",
      authors: "SSU Ahmed, NM Kakoty, B Suthar, Z Kalita, S Borah, K Bordoloi",
      journal: "Proceedings of the 2025 7th International Conference on Advances in Robotics …, 2025",
      year: 2025,
      type: "conference",
      citations: 0,
      abstract: "Research study on hand function recovery in chronic stroke patients using dynamic constraints based exorehabglove by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1145/3787370.3787427",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:yD5IFk8b50cC"
    },
    {
      id: 61,
      title: "Implementation and Validation of Task-Based Control for Bi-Manual Manipulation Using TurtleBot Manipulators",
      authors: "V Rathi, SV Shah, B Suthar, NP Singh",
      journal: "Proceedings of the 2025 7th International Conference on Advances in Robotics …, 2025",
      year: 2025,
      type: "conference",
      citations: 0,
      abstract: "Research study on implementation and validation of task-based control for bi-manual manipulation using turtlebot manipulators by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1145/3787370.3787433",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:cFHS6HbyZ2cC"
    },
    {
      id: 62,
      title: "Kinematic and Dynamic Modeling-Based Design Tool for Twisted String Actuators",
      authors: "V Rathi, B Suthar, B Rana",
      journal: "Proceedings of the 2025 7th International Conference on Advances in Robotics …, 2025",
      year: 2025,
      type: "conference",
      citations: 0,
      abstract: "Research study on kinematic and dynamic modeling-based design tool for twisted string actuators by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1145/3787370.3787437",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:dfsIfKJdRG4C"
    },
    {
      id: 63,
      title: "i-Sense: Design of a Biomimetic Prosthetic Hand",
      authors: "MP Chanu, Z Kalita, B Suthar, R Chutia, NM Kakoty",
      journal: "Proceedings of the 2025 7th International Conference on Advances in Robotics …, 2025",
      year: 2025,
      type: "conference",
      citations: 0,
      abstract: "Research study on i-sense: design of a biomimetic prosthetic hand by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1145/3787370.3787408",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:4OULZ7Gr8RgC"
    },
    {
      id: 64,
      title: "Robotic Drone Arm for civil structures inspection: Challenges and Future Directions: E3S Web of Conferences",
      authors: "B Suthar, R Mahadeva, S Dixit, V Kumar, K Arun, R Arora, S Ahuja",
      journal: "",
      year: 2023,
      type: "journal",
      citations: 0,
      abstract: "Research study on robotic drone arm for civil structures inspection: challenges and future directions: e3s web of conferences by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1051/e3sconf/202343001192",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:g5m5HwL7SMYC"
    },
    {
      id: 65,
      title: "Breast Cancer Diagnosis from Histopathology Images Using Deep Learning Methods: A Survey: E3S Web of Conferences",
      authors: "V Patel, V Chaurasia, R Mahadeva, A Ghosh, S Dixit, B Suthar, V Gupta, ...",
      journal: "",
      year: 2023,
      type: "journal",
      citations: 0,
      abstract: "Research study on breast cancer diagnosis from histopathology images using deep learning methods: a survey: e3s web of conferences by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1051/e3sconf/202343001195",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:M05iB0D1s5AC"
    },
    {
      id: 66,
      title: "Useful techniques and applications of computational intelligence",
      authors: "S Kumar, M Balamurugan, V Dave, B Suthar",
      journal: "Computational Intelligence in Software Modeling 13, 19, 2022",
      year: 2022,
      type: "journal",
      citations: 0,
      abstract: "Research study on useful techniques and applications of computational intelligence by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1515/9783110709247-002",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:_Qo2XoVZTnwC"
    },
    {
      id: 67,
      title: "안정된 청소수행을 위한 유연 작업기가 부착된 접이식 로봇팔에 대한 연구",
      authors: "최예진， 정슬",
      journal: "대한전자공학회 학술대회, 1188-1191, 2021",
      year: 2021,
      type: "journal",
      citations: 0,
      abstract: "Research study on 안정된 청소수행을 위한 유연 작업기가 부착된 접이식 로봇팔에 대한 연구 by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1201/9781351029421",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:isC4tDSrTZIC"
    },
    {
      id: 68,
      title: "A Bio-inspired Cat-Leap Parkour Rolling Mechanism (CPRM): Design Inception to Realization, and Applications",
      authors: "BSV Dave",
      journal: "https://haosu-robotics.github.io/PDFs/IROS2020%20Abstract%20-%20A%20Bio …, 2020",
      year: 2020,
      type: "conference",
      citations: 0,
      abstract: "Presents a multi-stage bio-inspired parkour locomotion mechanism mimicking feline leaping and kinetic-energy dissipating landing rolls for high-drop obstacle crossing.",
      doiUrl: "https://doi.org/10.36227/techrxiv.21657497",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:dhFuZR0502QC"
    },
    {
      id: 69,
      title: "Jittering removal in KUKA KR5 using modified kalman filter while teleoperation with exoskeleton",
      authors: "SM Shakshi rawal, Sachin Kansal , Mohd.Zubair, Bhivraj Suthar",
      journal: "The 8th Asian Conference on Multibody Dynamics, 2016",
      year: 2016,
      type: "conference",
      citations: 0,
      abstract: "Develops an adaptive Kalman filtering algorithm to attenuate physiological hand tremor and high-frequency noise from exoskeleton joint angle measurements.",
      doiUrl: "",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:UebtZRa9Y70C"
    },
    {
      id: 70,
      title: "Implementation of I2C Communication Protocol in Exoskeleton for tele-operation of Industrial Robot",
      authors: "MS Zubair M., Suthar B., Priyansh Z., Jaitly S.",
      journal: "International Conference on Multibody System Dynamics- 2016, 6, 2016",
      year: 2016,
      type: "conference",
      citations: 0,
      abstract: "Presents a low-latency digital sensor bus architecture utilizing I2C bus arbitration across multi-joint exoskeleton sensors to eliminate cabling bottlenecks during teleoperation.",
      doiUrl: "https://doi.org/10.1145/2506095.2506108",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:Se3iqnhoufwC"
    },
    {
      id: 71,
      title: "Inch worm mechanism for solar panel cleaning robot",
      authors: "DV Suthar B., Mukherjee S.",
      journal: "2nd International and 17th National Conference on Machines and Mechanisms …, 2015",
      year: 2015,
      type: "conference",
       citations: 0,
      abstract: "A waterless, automated solar panel cleaning robot employing an inchworm locomotion gait with dual-axis spiral brush cleaners to optimize PV farm maintenance.",
      doiUrl: "https://doi.org/10.1063/1.5032029",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:MXK_kJrjxJIC"
    },
    {
      id: 72,
      title: "Energy Efficient four figures robotic hand",
      authors: "SN Suthar B.",
      journal: "An International Conference & Exhibition on Cutting Edge Technological …, 2015",
      year: 2015,
      type: "conference",
      citations: 0,
      abstract: "Research study on energy efficient four figures robotic hand by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.11591/ijra.v5i1.pp1-5",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:3fE2CSJIrl8C"
    },
    {
      id: 73,
      title: "Haptics Exoskeletonfor Industrial Robot",
      authors: "KS Suthar B., Zubair Mohd., Mukherjee S.",
      journal: "International Conference on Multi body dynamics,imsd-acmd2014, 2014",
      year: 2014,
      type: "conference",
      citations: 0,
      abstract: "An ergonomic upper-limb master exoskeleton equipped with active DC torque motors providing real-time contact force reflection from remote slave manipulators.",
      doiUrl: "https://doi.org/10.1145/2506095.2506108",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:UeHWp8X0CEIC"
    },
    {
      id: 74,
      title: "Closed loop autonomous calibration of tele-operation exoskeleton exoskeleton for tele-operation of industrial robot",
      authors: "S Mukherjee, B Suthar, S Kansal, M Zubair",
      journal: "AIR 13, 04-06, 2013",
      year: 2013,
      type: "conference",
      citations: 0,
      abstract: "Research study on closed loop autonomous calibration of tele-operation exoskeleton exoskeleton for tele-operation of industrial robot by Dr. Bhivraj Suthar and collaborators at BIRDLab, IIT Jodhpur.",
      doiUrl: "https://doi.org/10.1145/2506095.2506108",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:JV2RwH3_ST0C"
    },
    {
      id: 75,
      title: "Kinematic and Dynamic Modelling-Based Design Tool for Twisted String Actuators,",
      authors: "VRB Suthar",
      journal: "Proceedings of conference on Advances in Robotics (AIR) 2025, 0",
      year: 2024,
      type: "conference",
      citations: 0,
      abstract: "Develops an open computational synthesis tool for simulating transmission ratio evolution, string fatigue lifetime, and closed-loop force tracking in twisted string actuator mechanisms.",
      doiUrl: "https://doi.org/10.1145/3787370.3787437",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:SeFeTyx0c_EC"
    },
    {
      id: 76,
      title: "Advancements in Precision Spraying of Agricultural Robots: A Comprehensive",
      authors: "K LOCHAN, A KHAN, I ELSAYED, B SUTHAR, L SENEVIRATNE, ...",
      journal: "",
      year: 2024,
      type: "journal",
      citations: 0,
      abstract: "This paper provides an exhaustive review of state-of-the-art agricultural robotics focusing on precision spraying mechanisms, vision-based target detection, droplet distribution dynamics, and bio-inspired actuator architectures.",
      doiUrl: "https://doi.org/10.1109/access.2024.3450904",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:ldfaerwXgEUC"
    },
    {
      id: 77,
      title: "Tele-operation of KUKA KR5 by an Arm Exoskeleton through Immersive Environment for Peg-in-Hole Operation",
      authors: "S Kansal, N Bugalia, B Suthar, M Zubair, S Mukherjee",
      journal: "",
      year: 2024,
      type: "journal",
      citations: 0,
      abstract: "Implements bilateral force-reflecting teleoperation between a human upper-limb exoskeleton and a 6-DOF industrial robot manipulator for precision peg-in-hole assembly tasks.",
      doiUrl: "https://doi.org/10.1016/j.procs.2018.07.055",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:eQOLeE2rZwMC"
    },
    {
      id: 78,
      title: "Inch worm mechanism for solar panel cleaning robot",
      authors: "B Suthar, S Mukherjee, V Dutta",
      journal: "",
      year: 2024,
      type: "journal",
      citations: 0,
      abstract: "A waterless, automated solar panel cleaning robot employing an inchworm locomotion gait with dual-axis spiral brush cleaners to optimize PV farm maintenance.",
      doiUrl: "https://doi.org/10.1063/1.5032029",
      scholarUrl: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=3KZSSEIAAAAJ&pagesize=100&citation_for_view=3KZSSEIAAAAJ:W7OEmFMy1HYC"
    }
  ];

  function computeStats(list, liveScholar) {
    const journalCount = list.filter((p) => (p.type || '').toLowerCase() === 'journal').length;
    const conferenceCount = list.filter((p) => (p.type || '').toLowerCase() === 'conference').length;
    const src = liveScholar || SCHOLAR_PROFILE;

    return {
      totalCitations: src.citations || SCHOLAR_PROFILE.citations,
      hIndex: src.hIndex || SCHOLAR_PROFILE.hIndex,
      i10Index: src.i10Index || SCHOLAR_PROFILE.i10Index,
      journalCount: journalCount,
      conferenceCount: conferenceCount,
      totalCount: list.length || SCHOLAR_PROFILE.papers
    };
  }

  /**
   * Real-time Multi-Tier Academic & Google Scholar Synchronization Engine
   */
  async function fetchLiveAcademicData() {
    let liveScholarMetrics = null;
    let livePubs = [];
    let sheetPubs = [];

    // Tier 1: Fetch live profile metrics from OpenAlex
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(OPENALEX_AUTHOR_API, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const authorData = await res.json();
        const citedBy = parseInt(authorData.cited_by_count, 10);
        const hIdx = parseInt(authorData.summary_stats?.h_index, 10);
        const i10Idx = parseInt(authorData.summary_stats?.i10_index, 10);
        const worksCnt = parseInt(authorData.works_count, 10);

        if (citedBy || hIdx) {
          liveScholarMetrics = {
            // Keep the higher of Scholar baseline or OpenAlex
            citations: Math.max(citedBy || 0, SCHOLAR_PROFILE.citations),
            hIndex: Math.max(hIdx || 0, SCHOLAR_PROFILE.hIndex),
            i10Index: Math.max(i10Idx || 0, SCHOLAR_PROFILE.i10Index),
            papers: Math.max(worksCnt || 0, SCHOLAR_PROFILE.papers)
          };
          console.log('[BIRDLab] Live author metrics synchronized:', liveScholarMetrics);
        }
      }
    } catch (e) {
      console.warn('[BIRDLab] OpenAlex author fetch notice:', e.message || e);
    }

    // Tier 2: Fetch live works from OpenAlex
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(OPENALEX_WORKS_API, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const worksData = await res.json();
        const results = worksData.results || [];
        if (results.length > 0) {
          livePubs = results.map((w, idx) => {
            const authorsList = (w.authorships || []).map(a => a.author?.display_name || '').filter(Boolean);
            const authorsStr = authorsList.length > 0 ? authorsList.join(', ') : 'Dr. Bhivraj Suthar';
            const venue = w.primary_location?.source?.display_name || w.host_venue?.display_name || '';
            const doi = w.doi || (w.ids?.doi ? `https://doi.org/${w.ids.doi}` : '');
            let type = 'Journal';
            if (w.type === 'review' || (w.title || '').toLowerCase().includes('review')) type = 'Review';
            else if (w.type === 'proceedings-article' || (venue || '').toLowerCase().includes('conference') || (venue || '').toLowerCase().includes('proceedings')) type = 'Conference';

            return {
              id: `live-${w.id || idx}`,
              title: w.title || '',
              authors: authorsStr,
              journal: venue,
              year: w.publication_year || new Date().getFullYear(),
              type: type,
              citations: parseInt(w.cited_by_count, 10) || 0,
              abstract: w.abstract || '',
              doiUrl: doi,
              fromLiveSync: true
            };
          }).filter(p => p.title);
          console.log('[BIRDLab] Synchronized', livePubs.length, 'live works from academic database.');
        }
      }
    } catch (e) {
      console.warn('[BIRDLab] Live works fetch notice:', e.message || e);
    }

    // Tier 3: Fetch custom rows from Google Sheet Apps Script (for manual additions from Admin)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(PUBLICATIONS_API + '?action=all&t=' + Date.now(), {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const items = extractRowsFromResponse(data);
        for (let i = 0; i < items.length; i++) {
          const pub = parseRowToPublication(items[i], i);
          if (pub) sheetPubs.push(pub);
        }
        if (sheetPubs.length > 0) {
          console.log('[BIRDLab] Google Sheet responded with', sheetPubs.length, 'custom rows');
        }
      }
    } catch (err) {
      console.warn('[BIRDLab] Sheet sync notice:', err.message || err);
    }

    return {
      livePubs: livePubs,
      sheetPubs: sheetPubs,
      scholarMetrics: liveScholarMetrics
    };
  }

  /**
   * Merge baseline publications with live synchronized publications & Google Sheet rows.
   */
  function mergePublications(baseline, livePubs, sheetPubs) {
    const cleanTitle = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const merged = [];
    const seenTitles = new Map();

    // 1. Google Sheet items (manual lab additions) appear first
    if (Array.isArray(sheetPubs)) {
      for (const p of sheetPubs) {
        const key = cleanTitle(p.title);
        if (key && !seenTitles.has(key)) {
          seenTitles.set(key, merged.length);
          merged.push(p);
        }
      }
    }

    // 2. Baseline verified publications (with abstracts & verified DOIs)
    for (const p of baseline) {
      const key = cleanTitle(p.title);
      if (key && !seenTitles.has(key)) {
        seenTitles.set(key, merged.length);
        merged.push({ ...p });
      }
    }

    // 3. Update existing records with live citation counts and DOIs from live sync
    if (Array.isArray(livePubs)) {
      for (const lp of livePubs) {
        const key = cleanTitle(lp.title);
        if (key && seenTitles.has(key)) {
          const existingIdx = seenTitles.get(key);
          const existing = merged[existingIdx];
          if (lp.citations > (existing.citations || 0)) {
            existing.citations = lp.citations;
          }
          if (!existing.doiUrl && lp.doiUrl) {
            existing.doiUrl = lp.doiUrl;
          }
        } else if (key && !seenTitles.has(key) && lp.title) {
          seenTitles.set(key, merged.length);
          merged.push(lp);
        }
      }
    }

    // 4. Sort by Year descending (newest first)
    merged.sort((a, b) => {
      const yA = parseInt(a.year, 10) || 0;
      const yB = parseInt(b.year, 10) || 0;
      if (yB !== yA) return yB - yA;
      if (a.fromSheet && !b.fromSheet) return -1;
      if (!a.fromSheet && b.fromSheet) return 1;
      return (b.citations || 0) - (a.citations || 0);
    });

    return merged;
  }

  // Read URL query parameters for initial state
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get('q') || '';

  // Internal state
  let publications = DEFAULT_PUBLICATIONS.slice();
  let filteredPubs = [];
  let selectedYear = 'all';
  let selectedType = 'all';
  let searchTerm = initialSearch;
  let loading = false;
  let stats = computeStats(DEFAULT_PUBLICATIONS, SCHOLAR_PROFILE);
  let lastUpdated = null;
  let visibleCount = 20;
  let copiedId = null;

  // DOM Elements
  const gridEl = document.getElementById('publicationGrid');
  const searchInput = document.getElementById('publicationSearch');
  const yearSelect = document.getElementById('yearFilter');
  const typeSelect = document.getElementById('typeFilter');
  const noResultsEl = document.getElementById('noResults');
  const loadingEl = document.getElementById('loadingIndicator');
  const paginationEl = document.getElementById('paginationBar');
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshIcon = document.getElementById('refreshIcon');
  const refreshText = document.getElementById('refreshText');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const counterTextEl = document.getElementById('counterText');
  const metricCitationsEl = document.getElementById('metric-citations');
  const metricHIndexEl = document.getElementById('metric-hindex');
  const metricI10El = document.getElementById('metric-i10');
  const metricPapersEl = document.getElementById('metric-papers');
  const publicationsSection = document.getElementById('publications');

  if (searchInput && initialSearch) {
    searchInput.value = initialSearch;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function updateMetrics() {
    const fmt = (n) => Number(n).toLocaleString('en-US');
    if (metricCitationsEl) metricCitationsEl.textContent = fmt(stats.totalCitations || SCHOLAR_PROFILE.citations);
    if (metricHIndexEl) metricHIndexEl.textContent = fmt(stats.hIndex || SCHOLAR_PROFILE.hIndex);
    if (metricI10El) metricI10El.textContent = fmt(stats.i10Index || SCHOLAR_PROFILE.i10Index);
    if (metricPapersEl) metricPapersEl.textContent = fmt(publications.length || stats.totalCount || SCHOLAR_PROFILE.papers);

    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = lastUpdated
        ? `Synced with Google Scholar: ${lastUpdated}`
        : 'Synchronized with Google Scholar (scholar.google.com)';
    }
  }

  function getUniqueYears() {
    const years = publications.map((pub) => pub.year).filter(Boolean);
    return [...new Set(years)].sort((a, b) => b - a);
  }

  function getUniqueTypes() {
    const types = publications.map((pub) => (pub.type || 'Journal').toLowerCase());
    return [...new Set(types)];
  }

  function populateFilterDropdowns() {
    const uniqueYears = getUniqueYears();
    const uniqueTypes = getUniqueTypes();

    if (yearSelect) {
      const currentYear = selectedYear;
      yearSelect.innerHTML =
        `<option value="all">All Years (${uniqueYears.length})</option>` +
        uniqueYears.map((yr) => `<option value="${yr}">${yr}</option>`).join('');
      yearSelect.value = currentYear;
    }

    if (typeSelect) {
      const currentType = selectedType;
      typeSelect.innerHTML =
        `<option value="all">All Types</option>` +
        uniqueTypes
          .map((t) => {
            const formatted = t
              .split(/[\s-]+/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
            return `<option value="${t}">${formatted}</option>`;
          })
          .join('');
      typeSelect.value = currentType;
    }
  }

  function setLoading(isLoading) {
    loading = isLoading;
    if (refreshBtn) refreshBtn.disabled = isLoading;
    if (refreshIcon) {
      if (isLoading) refreshIcon.classList.add('spinning');
      else refreshIcon.classList.remove('spinning');
    }
    if (refreshText) {
      refreshText.textContent = isLoading ? 'Syncing...' : 'Sync Data';
    }
    if (loadingEl) {
      loadingEl.style.display = isLoading ? 'flex' : 'none';
    }
  }

  function applyFilters() {
    let filtered = publications;

    if (selectedYear !== 'all') {
      filtered = filtered.filter((pub) => pub.year && pub.year.toString() === selectedYear);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((pub) => pub.type && pub.type.toLowerCase() === selectedType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((pub) => {
        const titleMatch = pub.title && pub.title.toLowerCase().includes(term);
        const authorsMatch =
          typeof pub.authors === 'string'
            ? pub.authors.toLowerCase().includes(term)
            : Array.isArray(pub.authors)
            ? pub.authors.some((author) => author.toLowerCase().includes(term))
            : false;
        const journalMatch = pub.journal && pub.journal.toLowerCase().includes(term);
        return titleMatch || authorsMatch || journalMatch;
      });
    }

    filteredPubs = filtered;
    render();
  }

  window.copyCitation = function (id) {
    const publication = filteredPubs.find((p) => String(p.id) === String(id));
    if (!publication) return;

    const authorsStr =
      typeof publication.authors === 'string'
        ? publication.authors
        : (publication.authors || []).join(', ');
    const yearStr = publication.year ? `, ${publication.year}` : '';
    const venueStr = publication.journal || publication.venue ? ` ${publication.journal || publication.venue}` : '';
    const citation = `${authorsStr}. "${publication.title}."${venueStr}${yearStr}.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(citation).catch(() => {
        fallbackCopyText(citation);
      });
    } else {
      fallbackCopyText(citation);
    }

    copiedId = id;
    renderCardsOnly();

    setTimeout(() => {
      if (copiedId === id) {
        copiedId = null;
        renderCardsOnly();
      }
    }, 2000);
  };

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(textArea);
  }

  window.loadMore = function () {
    visibleCount = Math.min(visibleCount + 20, filteredPubs.length);
    render();
  };

  window.showAll = function () {
    visibleCount = filteredPubs.length;
    render();
  };

  window.collapseTo20 = function () {
    visibleCount = 20;
    render();
    if (publicationsSection) {
      publicationsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Generate card HTML string with verified, working DOI links
   */
  function generateCardHTML(publication) {
    const citeCount =
      publication.citations !== undefined ? publication.citations : (publication.citation || 0);

    const targetUrl = normalizeDoiUrl(publication);
    const isDoi = Boolean(
      publication.doiUrl &&
      !publication.doiUrl.includes('scholar.google.com') &&
      !publication.doiUrl.includes('citations?view_op')
    );
    const btnLabel = isDoi ? 'View Paper' : 'View on Scholar';
    const btnTitle = isDoi ? 'Open official publisher publication via DOI' : 'View citation record on Google Scholar';

    const authorsStr =
      typeof publication.authors === 'string'
        ? publication.authors
        : (publication.authors || []).join(', ');

    const typeClass = (publication.type || 'journal').toLowerCase().replace(/\s+/g, '-');
    const isCopied = String(copiedId) === String(publication.id);

    return `
      <div class="publication-card" data-pub-id="${publication.id}">
        <div class="publication-header">
          <div class="publication-badges">
            <span class="publication-type ${typeClass}">
              ${escapeHTML(publication.type || 'Journal')}
            </span>
            ${
              publication.year
                ? `<span class="publication-year">${publication.year}</span>`
                : ''
            }
          </div>

          ${
            citeCount > 0
              ? `
            <span class="publication-citations" title="Citations on Google Scholar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
              Cited by ${citeCount}
            </span>
          `
              : ''
          }
        </div>

        <h3 class="publication-title">
          ${escapeHTML(publication.title)}
        </h3>

        <div class="publication-authors">
          ${escapeHTML(authorsStr)}
        </div>

        ${
          publication.journal
            ? `<div class="publication-venue">${escapeHTML(publication.journal)}</div>`
            : ''
        }

        ${
          publication.abstract
            ? `
          <div class="publication-abstract">
            <p>${escapeHTML(publication.abstract)}</p>
          </div>
        `
            : ''
        }

        <div class="publication-actions">
          ${
            targetUrl && targetUrl !== '#'
              ? `
            <a
              href="${targetUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="action-btn download-btn"
              title="${btnTitle}"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>${btnLabel}</span>
            </a>
          `
              : ''
          }

          <button
            onclick="copyCitation('${publication.id}')"
            class="action-btn cite-btn"
            title="Copy APA-style citation"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            <span id="cite-label-${publication.id}">${isCopied ? 'Copied!' : 'Cite'}</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderCardsOnly() {
    const displayedPubs = filteredPubs.slice(0, visibleCount);
    if (!gridEl) return;
    gridEl.innerHTML = displayedPubs.map(generateCardHTML).join('');
  }

  function render() {
    const displayedPubs = filteredPubs.slice(0, visibleCount);
    const hasMore = visibleCount < filteredPubs.length;

    if (counterTextEl) {
      const yearInfo = selectedYear !== 'all' ? ` from ${selectedYear}` : '';
      const typeInfo = selectedType !== 'all' ? ` (${selectedType})` : '';
      counterTextEl.innerHTML = `Showing <strong>${displayedPubs.length}</strong> of <strong>${filteredPubs.length}</strong> publications${yearInfo}${typeInfo}`;
    }

    if (filteredPubs.length === 0 && !loading) {
      if (gridEl) gridEl.innerHTML = '';
      if (noResultsEl) noResultsEl.style.display = 'block';
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    if (noResultsEl) {
      noResultsEl.style.display = 'none';
    }

    if (gridEl) {
      const pubsByYear = {};
      displayedPubs.forEach(pub => {
        const yr = pub.year || 'Other';
        if (!pubsByYear[yr]) pubsByYear[yr] = [];
        pubsByYear[yr].push(pub);
      });
      const sortedYears = Object.keys(pubsByYear).sort((a, b) => b - a);
      let html = '';
      sortedYears.forEach(yr => {
        html += `<h2 class="year-header">${yr}</h2>`;
        html += pubsByYear[yr].map(generateCardHTML).join('');
      });
      gridEl.innerHTML = html;
    }

    if (paginationEl) {
      if (hasMore) {
        paginationEl.innerHTML = `
          <div class="load-more-controls">
            <button
              class="load-more-btn"
              onclick="loadMore()"
            >
              Load More (+20)
            </button>
            <button
              class="show-all-btn"
              onclick="showAll()"
            >
              Show All (${filteredPubs.length})
            </button>
          </div>
        `;
      } else if (!hasMore && filteredPubs.length > 20) {
        paginationEl.innerHTML = `
          <div class="all-loaded-indicator">
            <span>All ${filteredPubs.length} publications displayed</span>
            <button
              class="collapse-btn"
              onclick="collapseTo20()"
            >
              Show First 20
            </button>
          </div>
        `;
      } else {
        paginationEl.innerHTML = '';
      }
    }

    if (window.gsap && gridEl) {
      const cards = gridEl.querySelectorAll('.publication-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.02,
            ease: 'power2.out'
          }
        );
      }
    }
  }

  const CACHE_VERSION = 'v5_scholar_synced';

  async function loadData() {
    try {
      const storedVersion = localStorage.getItem('scholar_publications_version');
      if (storedVersion !== CACHE_VERSION) {
        localStorage.removeItem('scholar_publications_' + DEFAULT_SCHOLAR_ID);
        localStorage.removeItem('scholar_publications_time');
        localStorage.removeItem('scholar_live_metrics');
        localStorage.setItem('scholar_publications_version', CACHE_VERSION);
      }
    } catch (e) {}

    // STEP 1: Immediately show baseline publications + metrics (instant zero-delay render)
    let initialLoaded = false;
    try {
      const cached = localStorage.getItem('scholar_publications_' + DEFAULT_SCHOLAR_ID);
      const cachedMetrics = localStorage.getItem('scholar_live_metrics');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          publications = parsed;
          filteredPubs = parsed;
          const savedMetrics = cachedMetrics ? JSON.parse(cachedMetrics) : null;
          stats = computeStats(parsed, savedMetrics);
          updateMetrics();
          populateFilterDropdowns();
          applyFilters();
          initialLoaded = true;
        }
      }
    } catch (e) {}

    if (!initialLoaded || publications.length === 0) {
      publications = DEFAULT_PUBLICATIONS.slice();
      filteredPubs = DEFAULT_PUBLICATIONS.slice();
      stats = computeStats(DEFAULT_PUBLICATIONS, SCHOLAR_PROFILE);
      updateMetrics();
      populateFilterDropdowns();
      applyFilters();
    }

    // STEP 2: Live background sync with Academic profile & Google Sheets
    setLoading(true);
    try {
      const result = await fetchLiveAcademicData();
      const { livePubs, sheetPubs, scholarMetrics } = result;

      const merged = mergePublications(DEFAULT_PUBLICATIONS, livePubs, sheetPubs);
      publications = merged;
      stats = computeStats(merged, scholarMetrics);
      lastUpdated = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      try {
        localStorage.setItem('scholar_publications_' + DEFAULT_SCHOLAR_ID, JSON.stringify(merged));
        localStorage.setItem('scholar_publications_time', Date.now().toString());
        if (scholarMetrics) {
          localStorage.setItem('scholar_live_metrics', JSON.stringify(scholarMetrics));
        }
      } catch (e) {}

      updateMetrics();
      populateFilterDropdowns();
      applyFilters();
    } catch (err) {
      console.warn('[BIRDLab] Background sync notice:', err.message || err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle Refresh / Sync Data button:
   * Clears cache -> fetches live Scholar metrics & publications -> updates UI.
   */
  async function handleRefresh() {
    setLoading(true);
    if (refreshText) refreshText.textContent = 'Syncing...';
    try {
      try {
        localStorage.removeItem('scholar_publications_' + DEFAULT_SCHOLAR_ID);
        localStorage.removeItem('scholar_publications_time');
        localStorage.removeItem('scholar_live_metrics');
      } catch (e) {}

      const result = await fetchLiveAcademicData();
      const { livePubs, sheetPubs, scholarMetrics } = result;

      const merged = mergePublications(DEFAULT_PUBLICATIONS, livePubs, sheetPubs);
      publications = merged;
      stats = computeStats(merged, scholarMetrics);
      lastUpdated = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      try {
        localStorage.setItem('scholar_publications_' + DEFAULT_SCHOLAR_ID, JSON.stringify(merged));
        localStorage.setItem('scholar_publications_time', Date.now().toString());
        if (scholarMetrics) {
          localStorage.setItem('scholar_live_metrics', JSON.stringify(scholarMetrics));
        }
      } catch (e) {}

      updateMetrics();
      populateFilterDropdowns();
      applyFilters();

      if (refreshText) {
        refreshText.textContent = 'Synced!';
        setTimeout(() => {
          if (refreshText) refreshText.textContent = 'Sync Data';
        }, 2200);
      }
    } catch (err) {
      console.error('[BIRDLab] Sync failed:', err.message || err);
      if (refreshText) refreshText.textContent = 'Sync Data';
    } finally {
      setLoading(false);
    }
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      applyFilters();
    });
  }

  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      selectedYear = e.target.value;
      applyFilters();
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      selectedType = e.target.value;
      applyFilters();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      selectedYear = 'all';
      selectedType = 'all';
      searchTerm = '';
      if (searchInput) searchInput.value = '';
      if (yearSelect) yearSelect.value = 'all';
      if (typeSelect) typeSelect.value = 'all';
      applyFilters();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
  });

  // Expose API for external integration
  window.googleScholarService = {
    getPublications: async function () {
      const { livePubs, sheetPubs } = await fetchLiveAcademicData();
      return mergePublications(DEFAULT_PUBLICATIONS, livePubs, sheetPubs);
    },
    getStats: async function () {
      return computeStats(publications, SCHOLAR_PROFILE);
    },
    refreshData: async function () {
      return handleRefresh();
    },
    getCacheInfo: function () {
      try {
        const time = localStorage.getItem('scholar_publications_time');
        return time ? { timestamp: Number(time) } : null;
      } catch (e) {
        return null;
      }
    }
  };
})();