import { CreatedInstance } from "../CreatedInstance"
import { LifecycleListener } from "../LifecycleListener"
import { ShadowGenerator, Scene, AbstractMesh } from "@babylonjs/core"

export default class ShadowGeneratorLifecycleListener implements LifecycleListener<ShadowGenerator> {
  private props: any
  private scene: Scene

  constructor(scene: Scene, props: any) {
    this.scene = scene
    this.props = props
  }

  onParented(parent: CreatedInstance<any>, child: CreatedInstance<any>): any {/* empty */}

  onChildAdded(child: CreatedInstance<any>, parent: CreatedInstance<any>): any {/* empty */}

  onMount(instance: CreatedInstance<ShadowGenerator>): void {
    let tmp: CreatedInstance<any> | null = instance.parent
    while (tmp !== null) {
      if (tmp.metadata.isShadowLight) {
        // console.log("Creating ShadowGenerator.  size:", this.props.mapSize, "light", tmp.hostInstance)
        instance.hostInstance = new ShadowGenerator(this.props.mapSize, tmp.hostInstance, this.props.useFullFloatFirst)
        break
      }
      tmp = tmp.parent
    }

    if (instance.hostInstance === undefined) {
      console.error("ShadowGenerator has no light source.");
      return;
    }

    if (instance.customProps.shadowCasters) {
      if (!Array.isArray(instance.customProps.shadowCasters)) {
        console.error("Shadow casters must be an array (of strings).", instance.customProps.shadowCasters)
        return;
      }

      let shadowCasters: string[] = instance.customProps.shadowCasters.slice(0)

      // TODO: also need a listener for models or if we want to add a predicate:
      this.scene.onNewMeshAddedObservable.add((mesh: AbstractMesh) => {
        if (shadowCasters.indexOf(mesh.name) >= 0) {
          // console.log("adding on observable shadow caster:", mesh.name)
          instance.hostInstance!.addShadowCaster(mesh)
          shadowCasters = shadowCasters.filter((name: string) => name !== mesh.name)
        }
      })

      this.scene.meshes.forEach((mesh: AbstractMesh) => {
        if (shadowCasters.indexOf(mesh.name) >= 0) {
          // console.log("adding shadow caster:", mesh.name)
          instance.hostInstance!.addShadowCaster(mesh)
          shadowCasters = shadowCasters.filter((name: string) => name !== mesh.name)
        }
      })
    }
  }
}
