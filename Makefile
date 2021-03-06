
DIR=extension
EXT=google_classic-$(VERSION).oex
INCLUDES=$(shell echo $(DIR)/includes/*.js)
#VERS_MAG=$(shell cat ../scriptweeder.js | grep 'var version' | sed -e "s|.*v\([0-9.]\+\)'.*|\1|")
VERSION=1.14

all: $(EXT)

$(EXT): $(DIR)/config.xml $(DIR)/index.html $(INCLUDES)
	@echo Generating $@
	@-cd $(DIR) && rm *~ */*~ > /dev/null 2>&1
	@cd $(DIR) && zip -r ../$@ *

# add version
$(DIR)/config.xml: Makefile
	@echo Generating $@
	@cat $(DIR)/config.xml | sed -e 's|^\(<widget .*\)version="[^"]*"|\1version="$(VERSION)"|' > $(DIR)/config.xml.tmp
	@mv $(DIR)/config.xml.tmp $(DIR)/config.xml

$(DIR)/includes/googlemonkeyr.user.js: FORCE
	@echo Generating $@
	@cat $@ | sed -e 's|var version_number = ".*"|var version_number = "$(VERSION)"|'  | \
	  sed -e "s|\\\$$Date[^$$]*\\\$$|\$$Date `date +'%b %d %Y'` \$$|" > temp
	@mv temp $@


clean:
	-rm *.oex *~ $(DIR)/includes/scriptweeder.js

FORCE:
