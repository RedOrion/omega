# Helper module to generate names (mythological)
#
# Copyright (C) 2012 Mohammed Morsi <mo@morsi.org>
# Licensed under the AGPLv3+ http://www.gnu.org/licenses/agpl.txt

module Omega

# The names module provides mechanisms to generate random names
# from a fixed list of well known names
module Names

MAX_SUFFIX=5

GREEK_NAMES = ["Acacius", "Achaikos", "Aeschylus", "Aesop", "Agape", "Agapetos", "Agapetus", "Agapios", "Agatha", "Agathe", "Agathon", "Agnes", "Aikaterine", "Akakios", "Alcaeus", "Alexander", "Alexandra", "Alexandros", "Alexios", "Alexis", "Alexius", "Ambrosia", "Ambrosios", "Ambrosius", "Ampelios", "Ampelius", "Amyntas", "Anacletus", "Anakletos", "Anastasia", "Anastasios", "Anastasius", "Anatolios", "Anatolius", "Anaxagoras", "Andreas", "Androcles", "Andronikos", "Anicetus", "Aniketos", "Anthousa", "Antigonus", "Antipater", "Aphrodisia", "Aphrodisios", "Apollinaris", "Apollodoros", "Apollonia", "Apollonios", "Arcadius", "Archelaos", "Archelaus", "Archimedes", "Archippos", "Argyros", "Aristarchos", "Aristarchus", "Aristeides", "Aristides", "Aristocles", "Aristodemos", "Aristokles", "Aristomache", "Ariston", "Aristophanes", "Aristoteles", "Aristotle", "Arkadios", "Arsenios", "Arsenius", "Artemidoros", "Artemisia", "Artemisios", "Asklepiades", "Aspasia", "Athanas", "Athanasia", "Athanasios", "Athanasius", "Athenais", "Basileios", "Basilius", "Berenice", "Berenike", "Bion", "Callias", "Charis", "Chariton", "Charmion", "Chloe", "Chrysanthe", "Chrysanthos", "Cleisthenes", "Cleitus", "Cleon", "Cleopatra", "Clitus", "Corinna", "Cosmas", "Cyrillus", "Cyrus", "Damianos", "Damianus", "Dareios", "Demetria", "Demetrios", "Demetrius", "Democritus", "Demon", "Demosthenes", "Demostrate", "Diodoros", "Diodorus", "Diodotos", "Diodotus", "Diogenes", "Diokles", "Dion", "Dionysios", "Dionysius", "Dionysodoros", "Doris", "Draco", "Eirenaios", "Eirene", "Elpis", "Epaphras", "Epaphroditos", "Epiktetos", "Erasmos", "Erastos", "Euanthe", "Euaristos", "Euclid", "Eudocia", "Eudokia", "Eudoxia", "Eugeneia", "Eugenia", "Eugenios", "Eugenius", "Eukleides", "Eulalia", "Eumelia", "Eunice", "Eunike", "Euphemia", "Euphemios", "Euphranor", "Euphrasia", "Eupraxia", "Euripides", "Eusebios", "Eusebius", "Eustachius", "Eustachus", "Eustathios", "Eustorgios", "Eustorgius", "Euthalia", "Euthymia", "Euthymios", "Euthymius", "Eutropia", "Eutropios", "Eutropius", "Eutychios", "Eutychius", "Eutychos", "Evaristus", "Gaiana", "Gaiane", "Galene", "Galenos", "Gennadios", "Gennadius", "Georgios", "Georgius", "Hagne", "Helena", "Helene", "Heliodoros", "Heracleitus", "Heraclius", "Herakleides", "Herakleios", "Herakleitos", "Hermes", "Hermogenes", "Hermokrates", "Hermolaos", "Hero", "Herodes", "Herodion", "Herodotus", "Heron", "Hesiod", "Hesperos", "Hieronymos", "Hieronymus", "Hilarion", "Hippocrates", "Hippokrates", "Hippolytos", "Homer", "Homeros", "Hyacinthus", "Hyakinthos", "Hyginos", "Hyginus", "Hypatia", "Hypatos", "Iason", "Irenaeus", "Irene", "Ireneus", "Isidora", "Isidoros", "Isocrates", "Kallias", "Kallikrates", "Kallisto", "Kallistos", "Kallistrate", "Karpos", "Kleisthenes", "Kleitos", "Kleon", "Kleopatra", "Kleopatros", "Korinna", "Kosmas", "Kyriakos", "Kyrillos", "Kyros", "Leon", "Leonidas", "Leontios", "Leontius", "Ligeia", "Linos", "Linus", "Loukianos", "Lycurgus", "Lycus", "Lykos", "Lykourgos", "Lysander", "Lysandra", "Lysandros", "Lysimachus", "Lysistrata", "Melissa", "Melitta", "Methodios", "Methodius", "Metrodora", "Metrophanes", "Miltiades", "Mnason", "Myron", "Myrrine", "Neophytos", "Nereus", "Nicanor", "Nicolaus", "Nicomedes", "Nicostratus", "Nikandros", "Nikanor", "Nike", "Nikephoros", "Niketas", "Nikias", "Nikodemos", "Nikolaos", "Nikomachos", "Nikomedes", "Nikon", "Nikostratos", "Olympias", "Olympiodoros", "Olympos", "Onesimos", "Onesiphoros", "Origenes", "Pamphilos", "Pancratius", "Pankratios", "Pantaleon", "Panther", "Pantheras", "Paramonos", "Pelagia", "Pelagios", "Pelagius", "Pericles", "Phaedrus", "Pherenike", "Philandros", "Phile", "Philippos", "Philo", "Philokrates", "Philon", "Philotheos", "Phocas", "Phoibe", "Phoibos", "Phokas", "Photina", "Photine", "Photios", "Plato", "Platon", "Ploutarchos", "Polycarp", "Porphyrios", "Praxiteles", "Prochoros", "Prokopios", "Ptolemaios", "Ptolemais", "Pyrrhos", "Pyrrhus", "Pythagoras", "Rhode", "Roxana", "Roxane", "Sappho", "Seleucus", "Simonides", "Socrates", "Sokrates", "Solon", "Sophia", "Sophocles", "Sophus", "Sosigenes", "Sostrate", "Stephanos", "Straton", "Syntyche", "Telesphoros", "Telesphorus", "Thais", "Thales", "Themistocles", "Theocritus", "Theodora", "Theodoros", "Theodorus", "Theodosia", "Theodosios", "Theodosius", "Theodotos", "Theodotus", "Theodoulos", "Theodulus", "Theokleia", "Theokritos", "Theophanes", "Theophania", "Theophila", "Theophilos", "Theophilus", "Theophylaktos", "Theron", "Thucydides", "Timaeus", "Timaios", "Timo", "Timon", "Timoteus", "Timothea", "Timotheos", "Tryphaina", "Tryphon", "Tryphosa", "Tycho", "Tychon", "Xanthe", "Xanthippe", "Xenia", "Xeno", "Xenocrates", "Xenon", "Xenophon", "Zenais", "Zeno", "Zenobia", "Zenobios", "Zenon", "Zephyros", "Zoe", "Zopyros", "Zosime", "Zosimos", "Zosimus", "Zoticus", "Zotikos"]

EGYPTIAN_NAMES = ["Aah", "Aken", "Aker", "Amaunet", "Amenhotep", "Ament ", "Am-Heh", "Ammut", "Amun ", "Anhur ", "Anta ", "Andjety", "Anti", "Anubis ", "Anuket ", "Apedemak", "Apep ", "Apis ", "Arensnuphis", "Ash", "Astarte", "Aten", "Atum ", "Auf ", "Ba Neb Tetet ", "Baal", "Baalat", "Babi", "Ba-Pef", "Bastet ", "Bat", "Benu", "Bes", "Dedwen", "Denwen", "Duamutef ", "Fetket", "Ha", "Hapi", "Hapy", "Hathor ", "Hatmehyt", "Haurun", "Heket ", "Heret-Kau", "Heryshaf ", "Hesat", "Hetepes-Sekhus", "Horus", "Ihy", "Imhotep ", "Khepra ", "Kherty", "Khnum ", "Khons ", "Maahes", "Ma'at", "Mafdet", "Mahaf", "Mandulis", "Mehen", "Mehet-Weret", "Mertseger ", "Meskhenet ", "Mesta ", "Mihos", "Min ", "Mnevis ", "Mont ", "Mut ", "Nebethetepet", "Nefertem ", "Nehebkau ", "Neheh ", "Neith ", "Nekhebet ", "Neper", "Orion ", "Pakhet", " Panebtawy", "Pelican ", "Peteese and Pihor", "Ptah ", "Ptah-Seker-Osiris", "Qebhsnuf ", "Qetesh ", "Saa ", "Satet ", "Sebek ", "Sebiumeker", "Sefkhet-Abwy", "Seker ", "Sekhmet ", "Selket ", "Sepa", "Septu ", "Serapis ", "Serqet ", "Seshat ", "Souls of Pe and Nekhen", "Ta-Bitjet", "Tasenetnofret", "Tatenen ", "Taueret ", "Tayet", "Uajyt ", "Wadj Wer", "Weneg", "Wepwawet ", "Wosret", "Yah", "Yamm"]

NORSE_NAMES = ["Aesir", "Alta", "Angrbotha", "Asgard", "Asynjr", "Balder", "Berserker", "Bertha", "Bor", "Bragi", "Brono", "Buri", "Bylgja", "Edda", "Eir", "Farbanti", "Fenrir", "Forseti", "Freya", "Freyr", "Frigga", "Fulla", "Garm", "Gefjon", "Gerd", "Ginnunggap", "Gioll", "Gladsheim", "Gleipnir", "Gna", "Gold-comb", "Gotterdammerung", "Gulltopr", "Gullveig", "Gungnir", "Gunlad", "Heimdall", "Hel", "Hermod", "Hlin", "Hodur", "Hoenir", "Hresvelgr", "Huldra", "Huginn", "Iduna", "Jord", "Jormungandr", "Jotunheim", "Kolga", "Lodur", "Lofn", "Loki", "Magni", "Mimir", "Modi", "Muninn", "Nanna", "Nastrand", "Nidhogg", "Niflheim", "Njord", "Norn", "Odin", "Ogres", "Outgard", "Ragnarok", "Ran", "Runes", "Runic", "Saga", "Seidr", "Sif", "Sjofn", "Skadi", "Sleipnir", "Snotra", "Surtr", "Syn", "Thiassi", "Thor", "Thrud", "Troll", "Tyr", "Ulle", "Valhalla", "Vali", "Valkyries", "Var", "Ve", "Vidar", "Vili", "Vingulf", "Vithar", "Vor", "Woden", "Yggdrasil", "Ymi"]

HAWAIIAN_NAMES = ["Akea", "Apukohai",  "Haulili",  "Hai",  "Hiaka",  "Hiiakawawahilani",  "Hinakuluiau",  "Kalaipahoa",  "Kaluannuunohonionio",  "Kamapua",  "Kamohoali",  "Kamooalii",  "Kanaloa",  "Kane",  "Kane",  "Kapo",  "Keoahikamakaua",  "Kapohoikahiola",  "Keuakepo",  "Kiha",  "Koleamoku",  "Ku",  "Kuahana",  "Kukaoo",  "Kane",  "Kaupe",  "Kukailimoku",  "Kuula",  "Laamaomao",  "Laka",  "Lakakane",  "Lie",  "Lono",  "Lonomakua",  "Mahulu",  "Manua",  "Maui",  "Milu",  "Moaalii",  "Mokualii",  "Mooaleo",  "Ouli",  "Poliahu",  "Papa",  "Pele",  "Puea",  "Ukanipo",  "Ulaulekeahi",  "Uli"]


# Master list of names to select from
#
# TODO names from other mythologies
NAMES = GREEK_NAMES + EGYPTIAN_NAMES + NORSE_NAMES + HAWAIIAN_NAMES + []

# Return a random name from the fixed list of {Names}
#
# @param [Hash] args optional arguments to use in name generation
# @option args [true,false] :with_suffix boolean indicating if we should append a
#   random numerical suffic to the name
def self.rand_name(args = {})
  with_suffix = args[:with_suffix] || false
  # TODO used_names argument (names to ignore in selection)

  name = NAMES[rand(NAMES.length-1)]
  name += " " + (1 + rand(MAX_SUFFIX - 1)).to_s if with_suffix

  return name
end

end # module Names
end # module Omega
