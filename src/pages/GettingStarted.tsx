import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Layers,
  Globe,
  Smartphone,
  Search,
  FileDown,
  ExternalLink,
} from 'lucide-react';

interface AccordionState {
  quickStart: boolean;
  proTips: boolean;
  exportBackup: boolean;
}

interface CardState {
  [key: number]: boolean;
}

const quickStartSteps = [
  {
    title: 'Add Link',
    description:
      'Click the + button in the top bar or use Ctrl+K to quickly add a new link. Paste the URL, give it a title, and optionally add tags to categorize it.',
  },
  {
    title: 'Create Folders',
    description:
      'Organize your links into folders by topic, project, or priority. Drag and drop links between folders to rearrange your collection.',
  },
  {
    title: 'Attach Files',
    description:
      'Each link supports file attachments — PDFs, images, documents. Perfect for storing receipts, screenshots, or reference materials alongside your links.',
  },
  {
    title: 'Sync to Disk',
    description:
      'Enable folder sync to automatically save your vault contents to a local directory. Your data stays on your machine, always accessible.',
  },
  {
    title: 'Open on Any Device',
    description:
      'LinkVault stores data in simple JSON files. Open them with any text editor, import into other tools, or keep as a portable archive.',
  },
];

const proTipsList = [
  {
    title: 'Tab Multitasking',
    detail:
      'Open multiple links at once by holding Ctrl (or Cmd) while clicking. LinkVault opens them in new tabs so you can batch-review your collection.',
  },
  {
    title: 'Custom Fields',
    detail:
      'Add custom fields to any link — prices, dates, notes, status. Use them to track job applications, project budgets, or course progress.',
  },
  {
    title: 'Bulk Actions',
    detail:
      'Select multiple links with Shift+Click or Ctrl+Click to move, tag, or delete them in bulk. Saves time when cleaning up large collections.',
  },
  {
    title: 'Folder Sync Structure',
    detail:
      'Each folder syncs to its own directory on disk. The JSON structure mirrors your folder hierarchy, making backups predictable and easy to navigate.',
  },
  {
    title: 'Drag to Reorder',
    detail:
      'Reorder links and folders by dragging them. The order is preserved in sync, so your sorted collections stay sorted everywhere.',
  },
];

const exportOptions = [
  {
    title: 'Excel Export',
    description:
      'Export your entire vault or selected folders to a .xlsx file. Each link becomes a row with title, URL, tags, custom fields, and notes.',
    icon: FileDown,
  },
  {
    title: 'Full ZIP Export',
    description:
      'Download a complete ZIP archive of your vault including all attachments, folder structure, and metadata. One file, everything included.',
    icon: FileDown,
  },
  {
    title: 'Auto Folder Sync',
    description:
      'Turn on auto-sync to continuously mirror your vault to a local folder. Every add, edit, or delete is reflected instantly on disk.',
    icon: ExternalLink,
  },
];

interface ExampleCard {
  id: number;
  title: string;
  icon: React.ElementType;
  color: string;
  accentClass: string;
  description: string;
  steps: string[];
}

const exampleCards: ExampleCard[] = [
  {
    id: 1,
    title: 'Job Search Tracker',
    icon: Search,
    color: 'vault-600',
    accentClass: 'border-l-vault-500',
    description:
      'Track every application from screening to offer, with attachments and custom fields for recruiter details.',
    steps: [
      'Create folders per stage: Applied, Phone Screen, Interview, Offer, Rejected.',
      'Attach your tailored resume and cover letter PDFs to each application link.',
      'Add tags like company name, role title, and location for quick filtering.',
      'Use custom fields to store recruiter email, phone number, and salary range.',
      'Set a status custom field to track where you are in the process at a glance.',
      'Drag links between folders as you advance — your pipeline stays visual and current.',
    ],
  },
  {
    id: 2,
    title: 'Recipe Collection',
    icon: BookOpen,
    color: 'amber-600',
    accentClass: 'border-l-amber-500',
    description:
      'Build a searchable digital cookbook with photos, notes, and meal-type folders.',
    steps: [
      'Organize folders by meal type: Breakfast, Lunch, Dinner, Desserts, Snacks.',
      'Save the recipe URL as your link, then attach a screenshot of the recipe card.',
      'Upload a photo of your finished dish — compare results side by side later.',
      'Tag recipes by cuisine, dietary restriction, or difficulty level.',
      'Add a custom notes field for substitutions, prep time, or serving adjustments.',
      'Rate recipes with a custom rating field so you know which ones to remake.',
    ],
  },
  {
    id: 3,
    title: 'DIY Project Dashboard',
    icon: Layers,
    color: 'emerald-600',
    accentClass: 'border-l-emerald-500',
    description:
      'Manage home improvement or maker projects with schematics, budgets, and progress photos.',
    steps: [
      'Create folders per project: Deck Build, Bathroom Reno, 3D Printer, Garden Shed.',
      'Attach schematics PDFs and material specification sheets to each project link.',
      'Build a parts list as notes — include part numbers, quantities, and store links.',
      'Use custom fields for budget, actual cost, and project deadline dates.',
      'Upload progress photos as attachments to document each phase of the build.',
      'Tag items by status: Planning, In Progress, Complete, On Hold.',
    ],
  },
  {
    id: 4,
    title: 'Travel Planning Hub',
    icon: Globe,
    color: 'sky-600',
    accentClass: 'border-l-sky-500',
    description:
      'Plan trips from dream to departure with confirmations, itineraries, and budgeting.',
    steps: [
      'Set up folders per country or trip: Japan 2026, Road Trip, Europe Backpacking.',
      'Save flight and hotel booking URLs, then attach the confirmation PDFs.',
      'Add tags for city, travel companion, and season (spring, summer, etc.).',
      'Use custom fields for booking reference number, total cost, and travel dates.',
      'Create an itinerary as link notes — day-by-day plans with addresses and times.',
      'Attach scanned copies of passports, visas, or travel insurance documents.',
    ],
  },
  {
    id: 5,
    title: 'Learning & Courses',
    icon: Lightbulb,
    color: 'purple-600',
    accentClass: 'border-l-purple-500',
    description:
      'Track online courses, tutorials, and certifications all in one place.',
    steps: [
      'Organize by topic folder: Python, UI Design, Data Science, Leadership.',
      'Save the course or tutorial URL — add the platform name as a tag (Udemy, Coursera, YouTube).',
      'Attach your notes file (Markdown or PDF) and any homework assignments.',
      'Upload screenshots of completed projects or certificates of completion.',
      'Use custom fields for total hours, percent complete, and date started.',
      'Tag courses by status: Watching, On Hold, Finished, Certified.',
    ],
  },
  {
    id: 6,
    title: 'Shopping Research',
    icon: Smartphone,
    color: 'rose-600',
    accentClass: 'border-l-rose-500',
    description:
      'Compare products, track prices, and make informed purchase decisions.',
    steps: [
      'Create folders per category: Laptops, Audio, Home Office, Fitness Gear.',
      'Save product links from multiple stores side by side for comparison.',
      'Use custom price fields — store current price, target price, and lowest seen.',
      'Attach spec sheets, review PDFs, or unboxing video links as references.',
      'Add custom fields for warranty length, shipping cost, and estimated delivery.',
      'Tag items by decision: Considering, Shortlisted, Purchased, Returned.',
    ],
  },
];

const GettingStarted: React.FC = () => {
  const [openSections, setOpenSections] = useState<AccordionState>({
    quickStart: true,
    proTips: false,
    exportBackup: false,
  });

  const [openCards, setOpenCards] = useState<CardState>({});

  const toggleSection = (key: keyof AccordionState) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCard = (id: number) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Getting Started</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Everything you need to know to get the most out of LinkVault — your
          personal knowledge hub for links, files, and ideas.
        </p>
      </div>

      {/* Quick Start Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('quickStart')}
          className="w-full flex items-center justify-between px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-900">
            Quick Start
          </span>
          {openSections.quickStart ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {openSections.quickStart && (
          <div className="divide-y divide-gray-100">
            {quickStartSteps.map((step, index) => (
              <div key={index} className="px-6 py-4 flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-vault-100 text-vault-600 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro Tips Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('proTips')}
          className="w-full flex items-center justify-between px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-900">
            Pro Tips
          </span>
          {openSections.proTips ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {openSections.proTips && (
          <div className="divide-y divide-gray-100">
            {proTipsList.map((tip, index) => (
              <div key={index} className="px-6 py-4 flex gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">{tip.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{tip.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export & Backup Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('exportBackup')}
          className="w-full flex items-center justify-between px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-900">
            Export &amp; Backup
          </span>
          {openSections.exportBackup ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {openSections.exportBackup && (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {exportOptions.map((opt, index) => (
              <div key={index} className="px-6 py-5 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-vault-100 text-vault-600 flex items-center justify-center">
                  <opt.icon className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900">{opt.title}</h3>
                <p className="text-sm text-gray-500">{opt.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creative Example Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Creative Use Cases
        </h2>
        <p className="text-gray-500">
          Real scenarios showing how LinkVault adapts to your workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exampleCards.map((card) => {
            const isOpen = openCards[card.id] ?? false;
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggleCard(card.id)}
                  className={`w-full text-left border-l-4 ${card.accentClass} p-4`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg bg-${card.color.replace(
                        '600',
                        '100'
                      )} text-${card.color} flex items-center justify-center`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">{card.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{isOpen ? 'Hide steps' : 'Show steps'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <ol className="space-y-2">
                      {card.steps.map((step, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-600 flex gap-2"
                        >
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-full bg-${card.color.replace(
                              '600',
                              '100'
                            )} text-${card.color} flex items-center justify-center text-xs font-bold`}
                          >
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
