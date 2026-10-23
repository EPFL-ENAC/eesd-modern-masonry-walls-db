Last update: 22/10/2026
Database modification after considering comments of ENAC IT4R in the first meeting to discuss the creation of the platform (01/10/2026), and the feedback provided by Pavia in our meeting (19/10/2026)

MODIFICATIONS ON THE PREVIOUS VERSION
The references were edited. References with Nref = 17, 18 and 21 were merged into a single one. References of the new tests added to the database were included.
Refinement of the description of maximum drift and shear force at maximum drift. This was implemented in "Fields" csv.
Crack measurements column was modified. Check the "Fields" csv to see how it is filled in now.
Drift at onset of cracking was modified ("Category V"). Now instead of having 2 columns (drift_cr + and -) we only have a single value (drift_cr). This was also modified in the "Fields" csv.
37 new tests were included to the database. The tests from 189 to 198 in the previous version that contain the full data (curves and photos) have been put at the end of the database. Now they correspond to numbers 227 to 236. The F-d, envelope and bilinear curve data files were re-named accordingly.
The description of the mean compressive strength of the mortar was complemented ("Category III") in the "Fields" csv.
The description of the shear span ratio was complemented ("Category IV") in the "Fields" csv.
2 new columns were added in "Category I". "Institution" and "Year" are described in the "Reference" csv.
1 new column was added in "Category II". "H/L" (aspect ratio) is described in the "Fields" csv.
2 new column was added in "Category III". "Unit density" and "Strength class" are described in "Fields" csv.
2 new column was added in "Category IV". "ALR" (axial load ratio) and "Boundary conditions" are described in "Fields" csv.
F-d data availability in the "Category V" was re-formulated. This time instead of a single column ("F-d data"), it was divided in 4 columns ("F-d data", "F-d figure", "Env curve", "Bil curve"). The description of each column is specified in the "Fields" csv.
4 new columns were added in "Category VI". "keff+" (effective stifness +), "keff-" (effective stifness -), "mu_u+" (ductility +) and "mu_u-" (ductility -) are described in the "Reference" csv.
The Bilinear idealisation [VI] was expanded and now it includes 2 distinc approaches. As consequence, instead of 1 category with the bilinear parameters we have 2 categories with names: "Bilinear idealisation Pavia [VI]" and "Bilinear idealisation EPFL [VII]" both with the same variables but determined according to a different methodology. This results in the inclusion of 10 new columns. Description of each variable was updated in "Fields" csv.
A new column "Category description" was added in "Fields" csv to shortly describe each category.
The 2 folders containing the envelope and bilinear curves we re-structured into 4 folders. Instead of having "03_envelope" and "04_bilinear_curve", now they are identified as "03_envelope_Pavia", "04_envelope_EPFL", "05_bilinear_curve_Pavia", "06_bilinear_curve_EPFL". As consequence, the subsequent folders were re-named following the new enumeration "07_fig_setup", "08_fig_failmode", "09_fig_materials" and "10_fig_cracks".
The both bilinear methods were applied to the 10 tests already included (227-236), updating the data in the respective envelope and bilinear folders (for Pavia and EPFL) and in the "Database" csv (Categeries VI and VII).
F-d curves of 6 tests were included (118-123) into the "02_fd_curve" folder. Also the envelope and bilinear curves were generated and the Categories VI and VII were updated.
It was added a new csv file specifying the reference of the figures. In this way the figures can be properly cited, because in few cases the publication that contains the data of the table is not the same as the one that contains the figures. The file is called "ModernMasonryDatabase_EIA_Fig_references" and it is inside the "01_references" folder.

GENERAL DESCRIPTION
Database of 236 shear-compression tests on modern masonry walls reported in the literature.
The information contained in this database is primarily (188 tests) taken from:
Morandi et al., 2018:  P. Morandi, L. Albanesi, F. Graziotti, T. Li Piani, A. Penna, G. Magenes, Development of a dataset on the in-plane experimental response of URM piers with bricks and blocks, Construction and Building Materials 190 (2018) 593–611. doi:10.1016/j.conbuildmat.2018.09.070
Morandi& Albanesi, 2026: P. Morandi, L. Albanesi, Experiment-based definition of limit states and derivation of in-plane drift capacity of brick and block urm walls for seismic design and assessment, Bulletin of Earthquake Engineering 24 (3) (2026) 1635–1683. doi:10.1007/s10518-025-02313-8 and further complemented.
Retrieved from https://drive.google.com/open?id=14hnlBUtTTzvtagF9VysYCtxTkq0W-A-u
This dataset has been updated by the authors (01/10/2026) by including 37 new tests (reaching a total number of 226 tests) but it is still not published.
10 additional tests were included from an experimental campaign conducted in EPFL.

DATABASE CONTENT
The database is contained in "ModernMasonryDatabase_EIA.xlsx" (Database tab) and "ModernMasonryDatabase_EIA_Database.csv".
The table includes 70 columns (#1, #2, ...) organised in 8 categories (I, II, ...).

[I] General Information (5 columns)
#01 N°: number of test/specimen.
#02 Reference: literature reference of the campaign.
#03 Institution: institution that conducted the test.
#04 Year: year of the document containing the test.
#05 Specimen name: name of the specimen in the original reference.
[II] Wall Characteristics (8 columns)
#06 Unit type: HC (Hollow Clay), AAC (Autoclaved Aerated Concrete), CS (Calcium Silicate), LAC (Lightweight Aggregate Concrete), SB-C (Solid Brick Clay), SB-CS (Solid Brick Calcium Silicate), CB (Concrete Brick), HCB (Hollow Concrete Block).
#07 N° Courses: number of unit courses.
#08 H [mm]: height of the specimen.
#09 L [mm]: length of the specimen.
#10 t [mm]: length of the specimen.
#11 Bed joints: GP (General Purpose), TL (Thin Layer).
#12 Head joints: F (Filled), TF (Thin Filled), MP (Mortar Pocket), UTG (Unfilled, Tongue and Groove), U (Unfilled).
#13 H/L [-]: aspect ratio.
[III] Material Properties (18 columns)
#14 Void ratio [%]: percentage of voids.
#15 Unit density [kg/m3]: gross density of units (weight over the gross volume of the units).
#16 lb [mm]: average length of the unit.
#17 wb [mm]: average width of the unit.
#18 hb [mm]: average height of the unit.
#19 fb,perp [MPa]: mean compressive strength of units in the direction perpendicular to the bed joint.
#20 fb,norm,perp [MPa]: normalised compressive strength of units in the direction perpendicular to the bed joint.
#21 fb,paral [MPa]: mean compressive strength of units in the direction parallel to the bed joint.
#22 fb,norm,paral [MPa]: normalised compressive strength of units in the direction parallel to the bed joint.
#23 Strength class: mortar strength class reported in the test campaign.
#24 fmo [MPa]: mean compressive strength of mortar. When this parameter was not reported, the minimum value according to the strength class was considered.
#25 fm,c [MPa]: mean compressive strength of masonry.
#26 fm,t [MPa]: mean diagonal tensile strength of masonry.
#27 Emo [MPa]: elastic modulus of mortar.
#28 Em [MPa]: elastic modulus of masonry.
#29 Gm [MPa]: shear modulus of masonry.
#30 fv0 [MPa]: initial shear strength of masonry.
#31 μ [-]: friction coefficient of masonry.
[IV] Test setup (4 columns)
#32 Boundary conditions: test boundary conditions reported in the test campaign: DF (Double fixed), C (Cantilever), O (Other).
#33 H0/H [-]: shear span ratio (height of zero moment-to-wall height ratio). When this value has not been provided, we have considered that "Cantilever" correspond to 1.0 and "Double fixed" to 0.5.
#34 σ0 [MPa]: compressive axial stress (total axial load divided by gross cross section of the specimen).
#35 ALR [-]: axial load ratio (compressive axial stress divided by the mean compressive strength of the masonry).
[V] Force-displacement response (14 columns)
#36 F-d data: availability of displacement vs force curve as data files.
#37 F-d figure: availability of displacement vs force curve only as a figure from where it can be manually traced envelopes and bilinear curves.
#38 Env curve: availability of envelope curve as data files. If either F-d data or F-d figure is "Yes", then the envelope can be obtained.
#39 Bil curve: availability of bilinear idealisation curve as data files. If either F-d data or F-d figure is "Yes", then the bilinear idealisation can be obtained.
#40 Failure mode: S (Shear), F (Flexure), H- (Hybrid followed by two main mechanisms), G (gaping), SL (Sliding), D (uncertain).
#41 δcr [%]: drift at onset of cracking (drift at first crack reported in the test).
#42 δVmax+ [%]: drift at maximum shear force in the positive direction.
#43 δVmax- [%]: drift at maximum shear force in the negative direction.
#44 Vmax+ [kN]: maximum shear force in the positive direction.
#45 Vmax- [kN]: maximum shear force in the negative direction.
#46 δmax+ [%]: maximum drift recorded under controlled conditions (before collapse) in the positive direction.
#47 δmax- [%]: maximum drift recorded under controlled conditions (before collapse) in the negative direction.
#48 Vδmax+ [kN]: shear force at maximum drift recorded under controlled conditions (before collapse) in the positive direction.
#49 Vδmax- [kN]: shear force at maximum drift recorded under controlled conditions (before collapse) in the negative direction.
[VI] Bilinear idealisation Pavia (10 columns)
#50 Vbil+ [kN]: equivalent shear force of the bilinear curve's plateau in the positive direction. This corresponds to the mean value of each shear force of the cyclic bilinear curve's plateau in the positive direction. The shear force of the cyclic bilinear curve's plateau in the positive direction (horizontal branch), determined by ensuring that the areas below the positive cyclic envelope curve and below the equivalent bilinear curve are equal.
#51 Vbil- [kN]: equivalent shear force of the bilinear curve's plateau in the negative direction. This corresponds to the mean value of each shear force of the cyclic bilinear curve's plateau in the negative direction. The shear force of the cyclic bilinear curve's plateau in the negative direction (horizontal branch), determined by ensuring that the areas below the negative cyclic envelope curve and below the equivalent bilinear curve are equal.
#52 δy+ [%]: equivalent yielding drift in th positive direction. This corresponds to the mean value of each cyclic yielding drift in the positive direction. The  cyclic yielding drift in the positive direction is determined by intersecting the two branches of the positive cyclic envelope.
#53 δy- [%]: equivalent yielding drift in th negative direction. This corresponds to the mean value of each cyclic yielding drift in the negative direction. The  cyclic yielding drift in the negative direction is determined by intersecting the two branches of the negative cyclic envelope.
#54 δu+ [%]: equivalent ultimate drift in the positive direction. This corresponds to the minimum value of each cyclic ultimate drift in the positive direction. The cyclic ultimate drift in the positive direction is the drift obtained  at 20% drop of positive maximum shear force in the positive cyclic envelope.
#55 δu- [%]: equivalent ultimate drift in the negative direction. This corresponds to the minimum value of each cyclic ultimate drift in the negative direction. The cyclic ultimate drift in the negative direction is the drift obtained  at 20% drop of negative maximum shear force in the negative cyclic envelope.
#56 keff+ [kN/mm]: equivalent effective stiffness in the positive direction. This corresponds to the ratio between the equivalent shear force of the bilinear curve's plateau and the equivalent yield drift in the positive direction.
#57 keff- [kN/mm]: equivalent effective stiffness in the negative direction. This corresponds to the ratio between the equivalent shear force of the bilinear curve's plateau and the equivalent yield drift in the negative direction.
#58 μu+ [-]: ductility (equivalent ultimate drift-to-equivalent yielding drift ratio) in the positive direction.
#59 μu- [-]: ductility (equivalent ultimate drift-to-equivalent yielding drift ratio) in the negative direction.
[VII] Bilinear idealisation EPFL (10 columns)
#60 Vbil+ [kN]: shear force of the bilinear curve's plateau in the positive direction (horizontal branch), determined by ensuring that the areas below the positive envelope curve and below the equivalent bilinear curve are equal.
#61 Vbil- [kN]: shear force of the bilinear curve's plateau in the negative direction (horizontal branch), determined by ensuring that the areas below the negative envelope curve and below the equivalent bilinear curve are equal.
#62 δy+ [%]: yielding drift in the positive direction, determined by intersecting the two branches of the positive envelope.
#63 δy- [%]: yielding drift in the negative direction, determined by intersecting the two branches of the negative envelope.
#64 δu+ [%]: ultimate drift in the positive direction, equivalent to the drift where the positive envelope undergoes 20% drop of positive maximum shear force.
#65 δu- [%]: ultimate drift in the nagetive direction, equivalent to the drift where the negative envelope undergoes 20% drop of negative maximum shear force.
#66 keff+ [kN/mm]: effective stiffness in the positive direction (secant to positive envelope at 70% of the positive maximum shear force). This slope determine the inclined branch of the positive envelope.
#67 keff- [kN/mm]: effective stiffness in the negative direction (secant to negative envelope at 70% of the negative maximum shear force). This slope determine the inclined branch of the negative envelope.
#68 μu+ [-]: ductility (ultimate drift-to-yielding drift ratio) in the positive direction.
#69 μu- [-]: ductility (ultimate drift-to-yielding drift ratio) in the negative direction.
[VII] Cracks (1 column)
#70 Crack measurements: crack measurements reported, specifying the method used: No (if no crack measurements were conducted), method implemented/short description (DIC, deep learning, fractal, etc).

FOLDER ORGANISATION OF THE COMPLETE DATA (INCLUDING CURVES AND IMAGES)
The folder "01_references" contains the details of the references where the data of each test specimen is contained and from where the figures were extracted. The information is stored in the csv files "ModernMasonryDatabase_EIA_References.csv" (for the data) and "ModernMasonryDatabase_EIA_Fig_references.csv" (for the figures), indicating the "Reference ID", "Institution ID" and "Year" that are referred in the "Reference", "Institution" and "Year" columns of "ModernMasonryDatabase_EIA_Database.csv"
The folder "02_fd_curve" contains the force-displacement curves in terms of drift [%] and force [kN] stored in csv files, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "fd_curve_N"
The folder "03_envelope_Pavia" contains the backbone cyclic envelopes in the positive and negative direction in terms of drift [%] and force [kN] stored in csv files, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "envelope_N_pos_cycleM" or "envelope_N_neg_cycleM" (where M is the number of cycle according to the loading protocol, normally taking values 2 or 3). In addition it contains the global envelope curves in the positive and negative directions following the format "envelope_N_pos" and "envelope_N_neg"
The folder "04_envelope_EPFL" contains the backbone envelopes in the positive and negative direction in terms of drift [%] and force [kN] stored in csv files, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "envelope_N_pos" or "envelope_N_neg"
The folder "05_bilinear_curve_Pavia" contains the cyclic bilinear idealisations in the positive and negative direction in terms of drift [%] and force [kN] stored in csv files, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "bilinear_N_pos_cycleM" or "bilinear_N_neg_cycleM" (where M is the number of cycle according to the loading protocol, normally taking values 2 or 3). In addition it contains the equivalent bilinear curves in the positive and negative directions obtained from the cyclic bilinear curves following the format "bilinear_N_pos" and "bilinear_N_neg"
The folder "06_bilinear_curve_EPFL" contains the bilinear idealisations in the positive and negative direction in terms of drift [%] and force [kN] stored in csv files, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "bilinear_N_pos" or "bilinear_N_neg"
The folder "07_fig_setup" contains the figures showing the test setup, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "fig_setup_N"
The folder "08_fig_failmode" contains the figures showing the failure mode of the specimen tested, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "fig_failmode_N"
The folder "09_fig_materials" contains the figures showing the material (units, mortar or assembly) of the test specimen, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "fig_mat_N"
The folder "10_fig_cracks" contains the figures showing the results of crack measurements performed on test specimens, identified according to the N column in "ModernMasonryDatabase_EIA_Database.csv" that specifies the specimen number and following the format "fig_cracks_N"
