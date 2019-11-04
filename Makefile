# generate typescript from flatbuffer schema
gen:
	@echo "Generate Typescript files."
	@flatc --ts -o $(CURDIR)/src/@gen/document --no-fb-import  $(CURDIR)/resources/flatbuffer/*.fbs