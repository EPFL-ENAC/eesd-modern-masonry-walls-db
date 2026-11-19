# Changelog

## [0.3.0](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/compare/v0.1.0...v0.3.0) (2026-11-19)


### Features

* **backend:** ingest an accepted submission into the dataset ([5871ec7](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/5871ec76c25a4de5e0ee125f09ac5f455f6bed86))
* **backend:** serve the contribution API (/validate, /contributions) ([521e6e1](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/521e6e1fd35d4fcfd4d60b2e1d59d653d8683dad))
* **backend:** skip the photo folders with a warning until photos go to git-lfs ([d493783](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/d4937832a888fa7c4f79744dff4c42852ef6b195))
* **backend:** validate contribution submissions with enacit4r-contrib ([8cb9e69](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/8cb9e690abb6f90bb394155832f763376f014970))
* **backend:** warn that a crack method needs its photo before ingest ([1224b12](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/1224b12c2b76ef6c7087746305630fdb67f967a7))
* contribution pipeline (validate and submit from the Submit page) ([afcc217](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/afcc217b7b5e63448685e17a292077e5882ffac7))
* **data:** add EESD's bilinearisation plots (git-lfs) ([76a0bd3](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/76a0bd35c5f9f7d9caa93bf794a27519efb915dc))
* **data:** load the 22/10/2026 delivery with Pavia and EPFL bilinear curves ([72dc3e6](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/72dc3e6f43e7b2ff5b2fd3f85cdefed9c3d53691))
* **data:** load the 22/10/2026 delivery with Pavia and EPFL bilinear curves ([2b59cd7](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/2b59cd7cdfd9a0a2490d3675ed1cfbc756457f45))
* **data:** read the dataset from eesd-modern-masonry-walls-data ([2e5ffc1](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/2e5ffc12a8835a60f39afb8cd592e00d748494ab))
* **data:** read the dataset from eesd-modern-masonry-walls-data ([44dfd4d](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/44dfd4d42daee1a806aec6def41bf026991f9afe))
* **data:** take EESD's revised 22/10/2026 delivery ([a702210](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/a702210ab1baef8a196ce0352843561815276e09))
* **data:** take EESD's revised 22/10/2026 delivery ([575d2d7](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/575d2d726b3f9d2be80431b121fd7408e28c81a9)), refs [#18](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/18) [#19](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/19) [#40](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/40)
* **frontend:** 3-decimal values, new default columns, no How to cite for now ([cec2d26](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/cec2d268aecaf0c882db2f20540c02f9e5c4c545))
* **frontend:** bring the home page flows into view ([88f9693](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/88f969384eaf922ab12c035a6494dfb17af5d403))
* **frontend:** bring the submit page and templates to the new structure ([c831d7a](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/c831d7abe90d5619d93ced6270ccaa25d24f5594))
* **frontend:** every F-d curve on one graph, each with its own toggle ([5007c23](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/5007c238759027284d7b7b426f90554d016bd520)), refs [#38](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/38)
* **frontend:** fold the database filters away, closed by default ([4a37925](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/4a379256d763ea22a63a5784b5f6ff6aec96cc15))
* **frontend:** fold the Visuals summary into the legend line ([a56aba2](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/a56aba2c7584298e130f186c925efc303047064f))
* **frontend:** link variable labels to their glossary row ([c27c947](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/c27c94742def47de0a6bb14967e2364c15b401f3))
* **frontend:** link variable labels to their glossary row ([9214770](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/92147705677d4eeed4f4d8b00f3c53c408f0b24f)), refs [#39](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/39)
* **frontend:** make the EESD header tag a plain link to the lab site ([dcbe30f](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/dcbe30f3e35c64e7e92ff911262a9305fab53b72))
* **frontend:** new default table columns ([6e57bcc](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/6e57bcc679895ec9a684efe698739589fcf3c6ae)), refs [#32](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/32)
* **frontend:** range sliders on the height and axial stress filters ([9d17373](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/9d173733e69e20332c83aaf7ce12e696d0291cf4))
* **frontend:** say that photos wait and that the review request is public ([544d63d](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/544d63d03c1908bf811b0587cec650bca6caade7))
* **frontend:** show a variable's definition on hover, everywhere it appears ([170ebf4](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/170ebf43b2925c725ba560659398e145f1830eeb))
* **frontend:** show numbers to 3 decimals at most ([c30d11e](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/c30d11e927bba1447959261333f01e0811c1b17c)), refs [#33](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/33)
* **frontend:** specimen and download in dialogs, columns in a dropdown ([38e5082](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/38e5082540de3a27bdd202f884478bd7ddb64f08))
* **frontend:** specimen and download in dialogs, columns in a dropdown ([9b88247](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/9b882471a8a354502c8fead99099bdaa96957d58))
* **frontend:** submit page talks to the contribution API ([216b61a](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/216b61a02bce83554c967fa316eba6291a925897))
* **frontend:** take 'How to cite' off the site for now ([627c016](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/627c016c8522aed26663dee83a758d181b5786d6)), refs [#31](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/31)
* **frontend:** UX pass on filters, visuals, tooltips and home page ([ec4ef98](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/ec4ef98759da8705beab89631053adf29d6e7846))
* ingest accepted contributions into the dataset (CSV is the master copy) ([ae1f5b8](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/ae1f5b85f966dabf5daa078309724144533b0bb2))


### Bug Fixes

* **backend:** warn, not refuse, on new text in the fm,t and Gm columns ([af615f2](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/af615f2983233931e4d7bb3025b46924de617ae9))
* **data:** create frontend/public before the copy, it is no longer in git ([bcb65c5](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/bcb65c565e1548851df7d0d33fdfc86c0e18eb86))
* **deploy:** pick the newest data tag without head under pipefail ([3b15863](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/3b15863376ba796af86478796610e64ba6c6d968))
* **docker:** use the nginx/nginx-unprivileged image ([7724a9a](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/7724a9a1192b1646cae36b42c0ccc881d77b0334))
* **docker:** use the nginx/nginx-unprivileged image ([829ec36](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/829ec3677298c4f3262be6e176feddfd40fd8f9a))
* **frontend:** address the review of the N_id and BibTeX changes ([82d4a65](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/82d4a65518562704eb44f4bc8d57a7217913cd76))
* **frontend:** clear the dev-server warnings ([5c21733](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/5c21733adde8ec24375c2380549e0d594fa1c1fe))
* **frontend:** clear the dev-server warnings ([14dcc73](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/14dcc73703116e3051c8e6064f63af1ff46be925))
* **frontend:** drop the postal address from the footer ([470008c](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/470008c6ebfae74f531bdae389fea48af1bf011e))
* **frontend:** drop the postal address from the footer ([1aecd52](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/1aecd5263da80bd98887ce922eedc1c26b22f67e)), refs [#17](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/17)
* **frontend:** export valid SVG figures ([51b2770](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/51b2770e0f462987ebc7c941662baea9eb2cad63))
* **frontend:** fold the header links into a menu on phones ([9fa3182](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/9fa3182d7899225e8d226cedf3daf782d4471090)), refs [#46](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/46)
* **frontend:** give H0/H = 0.5 its own bin ([ff68477](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/ff68477899dce3439f7992c9f64dc64c617c6147))
* **frontend:** keep the pointer cursor on clickable labels with a definition ([9ae30e9](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/9ae30e9ae55d0a49081080227b461824a65ac19e))
* **frontend:** let Institution and Year be picked in Columns ([6d386fa](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/6d386fa84b18474da865a04c6256ae8cd1a3dee6))
* **frontend:** list every H0/H bin in the filter, '&lt; 0.5' included ([3f1b055](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/3f1b0553796df47367f034e1f01f657ef7085eb6))
* **frontend:** no sideways scroll on phones ([a630f2a](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/a630f2aaf278e7f35bb4327b141245b9ecdd86af))
* **frontend:** no subscript in the Institution, Year and ALR labels ([8a38ffc](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/8a38ffc736808e7fd96b7375980d9c01d875982b))
* **frontend:** re-pin the design system to 55fc0a8 ([05dcc5e](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/05dcc5e60a75cca683852856bebd032603c346ec)), refs [#36](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/36)
* **frontend:** return focus to the Menu button when Escape closes it ([6e0044b](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/6e0044bbffe63d1884798389420ca03d6fb41c01))

## [0.1.0](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/compare/v0.0.1...v0.1.0) (2026-10-07)


### Features

* **frontend:** build the Modern Masonry Database front-end ([47b6b6d](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/47b6b6da2d78d487b4e0f7ca123cbf0d5df58b8f))
* **frontend:** use the design system's Vue kit, move all text to en.json ([142abcf](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/142abcff842d74f7c6a6c9545687fddae84715f9))
* **frontend:** serve the specimen photos as WebP ([c9d3b5b](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/c9d3b5b130e0415cc1eeacc22b99a7ba910ccaf3))


### Bug Fixes

* **ci:** pull the LFS photos from the ENAC-IT server in deploy ([a0a064b](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/a0a064b55b36f60d9b69ede91421f57662407762))
* **ci:** use the org's GIT_LFS_AUTH_* secrets ([d6be231](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/d6be2311850575dd196b1b8e26e7558e5f902348))
* **ci:** pin the deploy action to #33's merge commit ([90d1df1](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/90d1df1fd437da75e98124d737d352be5e0e5122))
* **frontend:** install git in the Docker build stage ([a08bf96](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/commit/a08bf9679a7fbc60c30459cc3ab4b9a9435564e0))
