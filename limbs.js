	
BABYLON.Mesh.prototype.minimizeVertices = function() {
		var _decPlaces = Math.pow(10, 8);

        var _pdata = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        var _ndata = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        var _idata = this.getIndices();    

        var _newPdata = []; //new positions array
        var _newIdata =[]; //new indices array

        var _mapPtr =0; // new index;
        var _uniquePositions = []; // unique vertex positions
        for(var _i=0; _i<_idata.length; _i+=3) {
            var _facet = [_idata[_i], _idata[_i + 1], _idata[_i+2]]; //facet vertex indices
            var _pstring = []; //lists facet vertex positions (x,y,z) as string "xyz""
            for(var _j = 0; _j<3; _j++) { //
                _pstring[_j] = "";
                for(var _k = 0; _k<3; _k++) {
                    //small values make 0
                    if (Math.abs(_pdata[3*_facet[_j] + _k]) < 0.0001) {
                        _pdata[3*_facet[_j] + _k] = 0;
                    }
                    _pstring[_j] += Math.round(_pdata[3*_facet[_j] + _k] * _decPlaces)/_decPlaces + "|";
                }
                _pstring[_j] = _pstring[_j].slice(0, -1); 			
            }
            //check facet vertices to see that none are repeated
            // do not process any facet that has a repeated vertex, ie is a line
            if(!(_pstring[0] == _pstring[1] || _pstring[0] == _pstring[2] || _pstring[1] == _pstring[2])) {        
                //for each facet position check if already listed in uniquePositions
                // if not listed add to uniquePositions and set index pointer
                // if listed use its index in uniquePositions and new index pointer
                for(var _j = 0; _j<3; _j++) { 
                    var _ptr = _uniquePositions.indexOf(_pstring[_j])
                    if(_ptr < 0) {
                        _uniquePositions.push(_pstring[_j]);
                        _ptr = _mapPtr++;
                        //not listed so add individual x, y, z coordinates to new positions array newPdata
                        //and add matching normal data to new normals array newNdata
                        for(var _k = 0; _k<3; _k++) {
                            _newPdata.push(_pdata[3*_facet[_j] + _k]);
                        }
                    }
                    // add new index pointer to new indices array newIdata
                    _newIdata.push(_ptr);
                }
            }
        }

        _newNdata =[]; //new normal data

        BABYLON.VertexData.ComputeNormals(_newPdata, _newIdata, _newNdata);

        //create new vertex data object and update
        var _vertexData = new BABYLON.VertexData();
        _vertexData.positions = _newPdata;
        _vertexData.indices = _newIdata;
        _vertexData.normals = _newNdata;

        _vertexData.applyToMesh(this);

    }	
	
	
var splitMesh = function(mesh, plane, scene) {  //plane passes through origin (0, 0, 0)
	
	var planeNorm = plane.normal.normalize();
	var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
	var uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
	var indices = mesh.getIndices();
	
	var edgeMapOrigin = positions.length;
	
	var pos_pdata = [];
	var pos_uvdata = []
    var pos_idata = []; 
	
	var neg_pdata = [];
	var neg_uvdata = []
    var neg_idata = []; 
	
	var pos_index = 0;
	var neg_index = 0;
	var pos_indexMap = [];
	var neg_indexMap = [];
	
	var edgeIndex = 0;
	var edgeIndexes = [];
	var edgeMapping = [];
	
	var a, b, c;
	var ipointx, ipointy1, ipointz;
	var iuvx, iuvy, iuvz;
	
	var px = [];
	var py = [];
	var pz = [];
	var vertex = [];
	var vectors = [];
	
	var lengths = [];
	
	var lambda = 0;
	var intersection = BABYLON.Vector3.Zero();
	var	direction = BABYLON.Vector3.Zero();
	var ray = new BABYLON.Ray(0, 0, 1, 0);
	
	var epsilon = Math.pow(10, -8);
	
	for(var facet = 0; facet < indices.length / 3; facet++) {
		for(var i = 0; i < 3; i++) {
			vertex[i] = indices[3 * facet + i];
			px[i] = positions[3 * vertex[i]];
			py[i] = positions[3 * vertex[i] + 1];
			pz[i] = positions[3 * vertex[i] + 2];
			vectors[i] = new BABYLON.Vector3(px[i], py[i], pz[i]);
		}	
		
		for(var i = 0; i < 3; i++) {	
			if(Math.abs(plane.normal.x * px[i] + plane.normal.y * py[i] + plane.normal.z * pz[i] + plane.d) < epsilon) {
				lengths[i] = 0;
			}
			else {
				ray = new BABYLON.Ray(vectors[i], plane.normal);
				lambda = ray.intersectsPlane(plane);
				if(lambda == null) {
					ray = new BABYLON.Ray(vectors[i], plane.normal.scale(-1));
					lambda = -1 * ray.intersectsPlane(plane);
				}
				lengths[i] = -1 * lambda;
			}		
		}
		
		
		
		var assignFacet = function(facet, pos) {
			if(pos) {
				for(var i = 0; i < 3; i++) {
					vertex[i] = indices[3 * facet + i];
					if(pos_indexMap[vertex[i]] == undefined) {
						pos_pdata.push(positions[3 * vertex[i]], positions[3 * vertex[i] + 1], positions[3 * vertex[i] + 2]);
						pos_uvdata.push(uvs[2 * vertex[i]], uvs[2 * vertex[i] + 1]);
						pos_indexMap[vertex[i]] = pos_index++;
					}
					pos_idata.push(pos_indexMap[vertex[i]]);
				}			
			}
			else {
				for(var i = 0; i < 3; i++) {
					vertex[i] = indices[3 * facet + i];
					if(neg_indexMap[vertex[i]] == undefined) {
						neg_pdata.push(positions[3 * vertex[i]], positions[3 * vertex[i] + 1], positions[3 * vertex[i] + 2]);
						neg_uvdata.push(uvs[2 * vertex[i]], uvs[2 * vertex[i] + 1]);
						neg_indexMap[vertex[i]] = neg_index++;
					}
					neg_idata.push(neg_indexMap[vertex[i]]);
				}				
			}
		}
		
		var ia = 0;
		var k = 0;
		var assigned = false;	
		while(!assigned) {		
			if (lengths[(ia + 1) % 3] + lengths[ia] == 0) { // two vertices on plane
				if(lengths[(ia + 2) % 3] > 0) {
					assignFacet(facet, true);
				}
				else {
					assignFacet(facet, false);					
				}
				assigned = true;
			}
			
			
			else if(lengths[(ia + 2) % 3] > 0 && lengths[(ia + 1) % 3] > 0 && lengths[ia] > 0) { // all vertices on positive side of plane
				assignFacet(facet, true);
				assigned = true;
			}
			
			
			else if (lengths[(ia + 2) % 3] < 0 && lengths[(ia + 1) % 3] < 0 && lengths[ia] < 0) { // all vertices on negative side of plane
				assignFacet(facet, false);
				assigned = true;
			}
			
			
			else if(lengths[ia] == 0 && lengths[(ia + 1) % 3] * lengths[(ia + 2) % 3] != 0 ) { // just one vertex on plane
				if(lengths[(ia + 1) % 3] * lengths[(ia + 2) % 3] > 0) { // both of other vertices on same side of plane				
					if(lengths[(ia + 2) % 3] > 0) {// both of other vertices positive
						assignFacet(facet, true);
					}
					else { // both negative
						assignFacet(facet, false);
					}
					assigned = true;
				}
				else { //other vertices on opposite sides of plane
					ipointx = (positions[3 * vertex[(ia + 1) % 3]] + positions[3 * vertex[(ia + 2) % 3]]) / 2;
					ipointy = (positions[3 * vertex[(ia + 1) % 3] + 1] + positions[3 * vertex[(ia + 2) % 3] + 1]) / 2;
					ipointz = (positions[3 * vertex[(ia + 1) % 3] + 2] + positions[3 * vertex[(ia + 2) % 3] + 2]) / 2;					
	
					iuvx = (uvs[2 * vertex[(ia + 1) % 3]] + uvs[2 * vertex[(ia + 2) % 3]]) / 2;
					iuvy = (uvs[2 * vertex[(ia + 1) % 3] + 1] + uvs[2 * vertex[(ia + 2) % 3] + 1]) / 2;
				
					a = Math.min(vertex[(ia + 1) % 3], vertex[(ia + 2) % 3]);
					b = Math.max(vertex[(ia + 1) % 3], vertex[(ia + 2) % 3]);				
					edgeIndex = edgeMapping.indexOf(a+"|"+b);
					
					if( edgeIndex < 0) {
						edgeMapping.push(a+"|"+b, pos_index, neg_index);
						pos_indexMap[edgeMapOrigin + pos_index] = pos_index++;
						neg_indexMap[edgeMapOrigin + neg_index] = neg_index++;
						edgeIndex = edgeMapping.indexOf(a+"|"+b);
						pos_pdata.push(ipointx, ipointy, ipointz);
						pos_uvdata.push(iuvx, iuvy);
						neg_pdata.push(ipointx, ipointy, ipointz);
						neg_uvdata.push(iuvx, iuvy);												
					}
					

					
					if (lengths[(ia + 1) % 3] > 0) {			
						// positive split in facet 			
						if(pos_indexMap[vertex[ia]] == undefined) {
							pos_pdata.push(positions[3 * vertex[ia]], positions[3 * vertex[ia] + 1], positions[3 * vertex[ia] + 2]);
							pos_uvdata.push(uvs[2 * vertex[ia]], uvs[2 * vertex[ia] + 1]);
							pos_indexMap[vertex[ia]] = pos_index++;
						}
						pos_idata.push(pos_indexMap[vertex[ia]]);
						
						if(pos_indexMap[vertex[(ia + 1) % 3]] == undefined) {
							pos_pdata.push(positions[3 * vertex[(ia + 1) % 3]], positions[3 * vertex[(ia + 1) % 3] + 1], positions[3 * vertex[(ia + 1) % 3] + 2]);
							pos_uvdata.push(uvs[2 * vertex[(ia + 1) % 3]], uvs[2 * vertex[(ia + 1) % 3] + 1]);
							pos_indexMap[vertex[(ia + 1) % 3]] = pos_index++;
						}
						pos_idata.push(pos_indexMap[vertex[(ia + 1) % 3]]);			
						
						pos_idata.push(pos_indexMap[edgeMapOrigin + edgeMapping[edgeIndex + 1]]);
					
						
						// negative split in facet 
						if(neg_indexMap[vertex[(ia + 2) % 3]] == undefined) {
							neg_pdata.push(positions[3 * vertex[(ia + 2) % 3]], positions[3 * vertex[(ia + 2) % 3] + 1], positions[3 * vertex[(ia + 2) % 3] + 2]);
							neg_uvdata.push(uvs[2 * vertex[(ia + 2) % 3]], uvs[2 * vertex[(ia + 2) % 3] + 1]);
							neg_indexMap[vertex[(ia + 2) % 3]] = neg_index++;
						}
						neg_idata.push(neg_indexMap[vertex[(ia + 2) % 3]]);
						
						if(neg_indexMap[vertex[ia]] == undefined) {
							neg_pdata.push(positions[3 * vertex[ia]], positions[3 * vertex[ia] + 1], positions[3 * vertex[ia] + 2]);
							neg_uvdata.push(uvs[2 * vertex[ia]], uvs[2 * vertex[ia] + 1]);
							neg_indexMap[vertex[ia]] = neg_index++;
						}
						neg_idata.push(neg_indexMap[vertex[ia]]);
						
						neg_idata.push(neg_indexMap[edgeMapOrigin + edgeMapping[edgeIndex + 2]]);			
				    }
					else {									
						// negative split in facet 
						if(neg_indexMap[vertex[ia]] == undefined) {
							neg_pdata.push(positions[3 * vertex[ia]], positions[3 * vertex[ia] + 1], positions[3 * vertex[ia] + 2]);
							neg_uvdata.push(uvs[2 * vertex[ia]], uvs[2 * vertex[ia] + 1]);
							neg_indexMap[vertex[ia]] = neg_index++;
						}
						neg_idata.push(neg_indexMap[vertex[ia]]);
					
						if(neg_indexMap[vertex[(ia + 1) % 3]] == undefined) {
							neg_pdata.push(positions[3 * vertex[(ia + 1) % 3]], positions[3 * vertex[(ia + 1) % 3] + 1], positions[3 * vertex[(ia + 1) % 3] + 2]);
							neg_uvdata.push(uvs[2 * vertex[(ia + 1) % 3]], uvs[2 * vertex[(ia + 1) % 3] + 1]);
							neg_indexMap[vertex[(ia + 1) % 3]] = neg_index++;
						}
						neg_idata.push(neg_indexMap[vertex[(ia + 1) % 3]]);
						
						neg_idata.push(neg_indexMap[edgeMapOrigin + edgeMapping[edgeIndex + 2]]);
						
						// positive split in facet 
						if(pos_indexMap[vertex[(ia + 2) % 3]] == undefined) {
							pos_pdata.push(positions[3 * vertex[(ia + 2) % 3]], positions[3 * vertex[(ia + 2) % 3] + 1], positions[3 * vertex[(ia + 2) % 3] + 2]);
							pos_uvdata.push(uvs[2 * vertex[(ia + 2) % 3]], uvs[2 * vertex[(ia + 2) % 3] + 1]);
							pos_indexMap[vertex[(ia + 2) % 3]] = pos_index++;
						}
						pos_idata.push(pos_indexMap[vertex[(ia + 2) % 3]]);
						
						if(pos_indexMap[vertex[ia]] == undefined) {
							pos_pdata.push(positions[3 * vertex[ia]], positions[3 * vertex[ia] + 1], positions[3 * vertex[ia] + 2]);
							pos_uvdata.push(uvs[2 * vertex[ia]], uvs[2 * vertex[ia] + 1]);
							pos_indexMap[vertex[ia]] = pos_index++;
						}
						pos_idata.push(pos_indexMap[vertex[ia]]);	

						pos_idata.push(pos_indexMap[edgeMapOrigin + edgeMapping[edgeIndex + 1]]);						
					} 						
					assigned = true; 
				}
			}
			else if (lengths[(ia + 1) % 3] * lengths[ia] < 0 && lengths[(ia + 2) % 3] * lengths[ia] < 0) { // one vertex (ia) lies on the opposite side of the plane to the other two
				for(var i = 0; i < 2; i++) {
					k = (ia + 2 + i) % 3;
					vectors[(k + 1) % 3].subtractToRef(vectors[k], direction);
					direction.normalize();					
					ray = new BABYLON.Ray(vectors[k], direction);
					lambda = ray.intersectsPlane(plane);					
					vectors[k].addToRef(direction.scale(lambda), intersection);					
					iuvx = (uvs[2 * vertex[k]] + uvs[2 * vertex[(k + 1) % 3]]) / 2;
					iuvy = (uvs[2 * vertex[k] + 1] + uvs[2 * vertex[(k + 1) % 3] + 1]) / 2;
					a = Math.min(vertex[k], vertex[(k + 1) % 3]);
					b = Math.max(vertex[k], vertex[(k + 1) % 3]);
					edgeIndexes[k] = edgeMapping.indexOf(a+"|"+b);					
					if(edgeIndexes[k] < 0) {
						edgeMapping.push(a+"|"+b, pos_index, neg_index);
						edgeIndexes[k] = edgeMapping.indexOf(a+"|"+b);
						
						pos_pdata.push(intersection.x, intersection.y, intersection.z);
						pos_uvdata.push(iuvx, iuvy);
						pos_indexMap[edgeMapOrigin + pos_index] = pos_index++;
						
						neg_pdata.push(intersection.x, intersection.y, intersection.z);
						neg_uvdata.push(iuvx, iuvy);
						neg_indexMap[edgeMapOrigin + neg_index] = neg_index++;
					}
				}					
				if(lengths[ia] > 0) {					
					if(pos_indexMap[vertex[ia]] == undefined) {
						pos_pdata.push(positions[3 * vertex[ia]], positions[3 * vertex[ia] + 1], positions[3 * vertex[ia] + 2]);
						pos_uvdata.push(uvs[2 * vertex[ia]], uvs[2 * vertex[ia] + 1]);
						pos_indexMap[vertex[ia]] = pos_index++;
					}
					pos_idata.push(pos_indexMap[vertex[ia]]);						
					
					pos_idata.push(pos_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[ia] + 1]]);
					
					pos_idata.push(pos_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[(ia + 2) % 3] + 1]]);
					
					//
					
					if(neg_indexMap[vertex[(ia + 2) % 3]] == undefined) {
						neg_pdata.push(positions[3 * vertex[(ia + 2) % 3]], positions[3 * vertex[(ia + 2) % 3] + 1], positions[3 * vertex[(ia + 2) % 3] + 2]);
						neg_uvdata.push(uvs[2 * vertex[(ia + 2) % 3]], uvs[2 * vertex[(ia + 2) % 3] + 1]);
						neg_indexMap[vertex[(ia + 2) % 3]] = neg_index++;
					}
					neg_idata.push(neg_indexMap[vertex[(ia + 2) % 3]]);
					
					neg_idata.push(neg_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[(ia + 2) % 3] + 2]]);
					
					neg_idata.push(neg_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[ia] + 2]]);
					
					//
					
					if(neg_indexMap[vertex[(ia + 2) % 3]] == undefined) {
						neg_pdata.push(positions[3 * vertex[(ia + 2) % 3]], positions[3 * vertex[(ia + 2) % 3] + 1], positions[3 * vertex[(ia + 2) % 3] + 2]);
						neg_uvdata.push(uvs[2 * vertex[(ia + 2) % 3]], uvs[2 * vertex[(ia + 2) % 3] + 1]);
						neg_indexMap[vertex[(ia + 2) % 3]] = neg_index++;
					}
					neg_idata.push(neg_indexMap[vertex[(ia + 2) % 3]]);
					
					neg_idata.push(neg_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[ia] + 2]]);
					
					if(neg_indexMap[vertex[(ia + 1) % 3]] == undefined) {
						neg_pdata.push(positions[3 * vertex[(ia + 1) % 3]], positions[3 * vertex[(ia + 1) % 3] + 1], positions[3 * vertex[(ia + 1) % 3] + 2]);
						neg_uvdata.push(uvs[2 * vertex[(ia + 1) % 3]], uvs[2 * vertex[(ia + 1) % 3] + 1]);
						neg_indexMap[vertex[(ia + 1) % 3]] = neg_index++;
					}
					neg_idata.push(neg_indexMap[vertex[(ia + 1) % 3]]);
				}
				else {					
					if(neg_indexMap[vertex[ia]] == undefined) {
						neg_pdata.push(positions[3 * vertex[ia]], positions[3 * vertex[ia] + 1], positions[3 * vertex[ia] + 2]);
						neg_uvdata.push(uvs[2 * vertex[ia]], uvs[2 * vertex[ia] + 1]);
						neg_indexMap[vertex[ia]] = neg_index++;
					}
					neg_idata.push(neg_indexMap[vertex[ia]]);
					
					neg_idata.push(neg_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[ia] + 2]]);
					
					neg_idata.push(neg_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[(ia + 2) % 3] + 2]]);
					
					//
					
					if(pos_indexMap[vertex[(ia + 2) % 3]] == undefined) {
						pos_pdata.push(positions[3 * vertex[(ia + 2) % 3]], positions[3 * vertex[(ia + 2) % 3] + 1], positions[3 * vertex[(ia + 2) % 3] + 2]);
						pos_uvdata.push(uvs[2 * vertex[(ia + 2) % 3]], uvs[2 * vertex[(ia + 2) % 3] + 1]);
						pos_indexMap[vertex[(ia + 2) % 3]] = pos_index++;
					}
					pos_idata.push(pos_indexMap[vertex[(ia + 2) % 3]]);
					
					pos_idata.push(pos_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[(ia + 2) % 3] + 1]]);
					
					pos_idata.push(pos_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[ia] + 1]]);
					
					//
					if(pos_indexMap[vertex[(ia + 2) % 3]] == undefined) {
						pos_pdata.push(positions[3 * vertex[(ia + 2) % 3]], positions[3 * vertex[(ia + 2) % 3] + 1], positions[3 * vertex[(ia + 2) % 3] + 2]);
						pos_uvdata.push(uvs[2 * vertex[(ia + 2) % 3]], uvs[2 * vertex[(ia + 2) % 3] + 1]);
						pos_indexMap[vertex[(ia + 2) % 3]] = pos_index++;
					}
					pos_idata.push(pos_indexMap[vertex[(ia + 2) % 3]]);
					
					pos_idata.push(pos_indexMap[edgeMapOrigin + edgeMapping[edgeIndexes[ia] + 1]]);
					
					if(pos_indexMap[vertex[(ia + 1) % 3]] == undefined) {
						pos_pdata.push(positions[3 * vertex[(ia + 1) % 3]], positions[3 * vertex[(ia + 1) % 3] + 1], positions[3 * vertex[(ia + 1) % 3] + 2]);
						pos_uvdata.push(uvs[2 * vertex[(ia + 1) % 3]], uvs[2 * vertex[(ia + 1) % 3] + 1]);
						pos_indexMap[vertex[(ia + 1) % 3]] = pos_index++;
					}
					pos_idata.push(pos_indexMap[vertex[(ia + 1) % 3]]);
						
					
				}  
				assigned = true;				
			} 
			ia++			
		}			
	}
	
	var pos_normals = [];
	
	BABYLON.VertexData.ComputeNormals(pos_pdata, pos_idata, pos_normals);
	
	var vertexData = new BABYLON.VertexData();
	vertexData.positions = pos_pdata;
	vertexData.indices = pos_idata;
	vertexData.normals = pos_normals;
	vertexData.uvs = pos_uvdata;
	
	var pos_half = new BABYLON.Mesh("ph", scene);
	vertexData.applyToMesh(pos_half);
	

	var neg_normals = [];
	
	BABYLON.VertexData.ComputeNormals(neg_pdata, neg_idata, neg_normals);

	var vertexData = new BABYLON.VertexData();
	vertexData.positions = neg_pdata;
	vertexData.indices = neg_idata;
	vertexData.normals = neg_normals;
	vertexData.uvs = neg_uvdata;

	var neg_half = new BABYLON.Mesh("ph", scene);
	vertexData.applyToMesh(neg_half);	
	return {positive_section:pos_half, negative_section:neg_half}
}	
	


